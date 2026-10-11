import {
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { from, of, switchMap, throwError } from 'rxjs';
import { App } from '../../app';
import { routes } from '../../app.routes';
import type { Actor } from '../../shop/access';
import { handleAccountHttp } from '../../shop/account-server';
import type { AccountDirectory } from '../../shop/account-server';
import { NeonAuth } from '../../shop/neon-auth';
import {
  FLOOR_PASSWORD_HINT,
  handleShopHttp,
  openSession,
  resetShopServer,
} from '../../shop/shop-server';
import { ShopSession } from '../../shop/shop-session';

const ADA: Actor = {
  id: '5b0e1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  role: 'client',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
};

/** Neon Auth as the pages see it, without a network: it records what the pages asked for. */
class FakeNeonAuth {
  readonly calls: string[] = [];

  async sessionToken(mode: string, email: string, password: string): Promise<string> {
    this.calls.push(`${mode} ${email} ${password}`);
    return 'fresh-jwt';
  }

  async signOut(): Promise<void> {
    this.calls.push('sign-out');
  }

  async changePassword(email: string, current: string, next: string): Promise<void> {
    this.calls.push(`change-password ${email} ${current} ${next}`);
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    this.calls.push(`request-reset ${email} ${redirectTo}`);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    this.calls.push(`reset ${token} ${password}`);
  }
}

class Directory implements AccountDirectory {
  readonly removed: string[] = [];
  async rename(): Promise<void> {}
  async remove(id: string): Promise<void> {
    this.removed.push(id);
  }
}

describe('account pages', () => {
  let neon: FakeNeonAuth;
  let directory: Directory;

  const api: HttpInterceptorFn = (req, next) => {
    const url = new URL(req.url, 'http://marlow.test');
    if (!url.pathname.startsWith('/api/')) {
      return next(req);
    }
    const authorization = req.headers.get('Authorization');
    const answer = handleAccountHttp(req.method, url.pathname, req.body, authorization, {
      directory,
      verifyFreshSignIn: async (token) =>
        token === 'fresh-jwt' ? { id: ADA.id, issuedAt: Date.now() } : null,
      now: Date.now,
    }).then(
      (account) => account ?? handleShopHttp(req.method, url.pathname, req.body, authorization),
    );
    return from(answer).pipe(
      switchMap((result) =>
        result.status >= 400
          ? throwError(() => new HttpErrorResponse({ status: result.status, error: result.body }))
          : of(new HttpResponse({ status: result.status, body: result.body })),
      ),
    );
  };

  beforeEach(() => {
    resetShopServer();
    localStorage.clear();
    neon = new FakeNeonAuth();
    directory = new Directory();
  });

  async function render(url: string, signIn?: 'neon' | 'floor'): Promise<ComponentFixture<App>> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([api])),
        { provide: NeonAuth, useValue: neon },
      ],
    });
    const fixture = TestBed.createComponent(App);
    const session = TestBed.inject(ShopSession);
    if (signIn === 'neon') {
      const { token } = openSession(ADA);
      session.adopt(ADA, token);
    }
    if (signIn === 'floor') {
      const result = handleShopHttp(
        'POST',
        '/api/session',
        { email: 'avery@marlow.shop', password: FLOOR_PASSWORD_HINT },
        null,
      );
      const body = result.body as { token: string; actor: Actor };
      session.adopt(body.actor, body.token);
    }
    await go(fixture, url);
    return fixture;
  }

  it('shows a floor account read-only, with no password or delete controls', async () => {
    await render('/account', 'floor');

    expect(document.body.textContent).toContain('Your account');
    expect(document.body.textContent).toContain('shared floor account');
    expect(document.getElementById('account-name')).toBeNull();
    expect(buttonNamed('Delete account')).toBeUndefined();
  });

  it('saves a new name and shows it at once', async () => {
    const fixture = await render('/account', 'neon');

    await typeInto(fixture, 'account-name', 'Ada King');
    await click(fixture, 'Save name');

    expect(document.body.textContent).toContain('Saved. The shop uses this name from now on.');
    expect(document.body.textContent).toContain('Signed in as Ada King, ada@example.com.');
  });

  it('changes the password only when the new one is typed the same twice', async () => {
    const fixture = await render('/account', 'neon');

    await typeInto(fixture, 'password-current', 'old-password');
    await typeInto(fixture, 'password-new', 'new-password-1');
    await typeInto(fixture, 'password-confirm', 'new-password-2');
    await click(fixture, 'Change password');
    expect(document.body.textContent).toContain('Type the same new password twice.');
    expect(neon.calls).toEqual([]);

    await typeInto(fixture, 'password-confirm', 'new-password-1');
    await click(fixture, 'Change password');
    expect(neon.calls).toEqual(['change-password ada@example.com old-password new-password-1']);
    expect(document.body.textContent).toContain('Password changed.');
  });

  it('deletes the account after the password, and says what happened on the sign-in page', async () => {
    const fixture = await render('/account', 'neon');

    await click(fixture, 'Delete account');
    await typeInto(fixture, 'delete-password', 'my-password');
    const confirm = [
      ...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button'),
    ].find((button) => button.textContent?.includes('Delete account'));
    confirm?.click();
    await settle(fixture);

    expect(neon.calls).toEqual(['sign-in ada@example.com my-password', 'sign-out']);
    expect(directory.removed).toEqual([ADA.id]);
    expect(TestBed.inject(Router).url).toBe('/sign-in');
    expect(TestBed.inject(ShopSession).isSignedIn()).toBe(false);
    expect(document.body.textContent).toContain('Your account is deleted.');
  });

  it('sends people without a session to sign in', async () => {
    await render('/account');

    expect(TestBed.inject(Router).url).toBe('/sign-in');
    expect(document.body.textContent).toContain('Forgot your password?');
  });

  it('sends a reset link that comes back to this shop, and does not say whether the account exists', async () => {
    const fixture = await render('/forgot-password');

    await typeInto(fixture, 'reset-email', 'ada@example.com');
    await click(fixture, 'Send the link');

    expect(neon.calls).toEqual([`request-reset ada@example.com ${location.origin}/reset-password`]);
    expect(document.body.textContent).toContain('Check your inbox');
    expect(document.body.textContent).toContain('If a Marlow account uses ada@example.com');
  });

  it('sets a new password from a good link', async () => {
    const fixture = await render('/reset-password?token=abc123');

    await typeInto(fixture, 'reset-new', 'brand-new-pass');
    await typeInto(fixture, 'reset-confirm', 'brand-new-pass');
    await click(fixture, 'Save the new password');

    expect(neon.calls).toEqual(['reset abc123 brand-new-pass']);
    expect(document.body.textContent).toContain('Your password is changed');
  });

  it('explains an expired link instead of showing a form that cannot work', async () => {
    await render('/reset-password?error=INVALID_TOKEN');

    expect(document.body.textContent).toContain('That link has expired or was already used');
    expect(document.getElementById('reset-new')).toBeNull();
  });

  it('offers Account in the header once someone is signed in', async () => {
    await render('/', 'neon');

    const header = document.querySelector('header')?.textContent ?? '';
    expect(header).toContain('Account');
    expect(header).not.toContain('Sign in');
  });
});

function buttonNamed(name: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
    button.textContent?.includes(name),
  );
}

async function settle(fixture: ComponentFixture<App>): Promise<void> {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
}

async function go(fixture: ComponentFixture<App>, url: string): Promise<void> {
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
}

async function click(fixture: ComponentFixture<App>, name: string): Promise<void> {
  const button = buttonNamed(name);
  if (!button) {
    throw new Error(`No button named ${name}. Page: ${document.body.textContent?.slice(0, 400)}`);
  }
  button.click();
  await settle(fixture);
}

async function typeInto(fixture: ComponentFixture<App>, id: string, value: string): Promise<void> {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`No field ${id}. Page: ${document.body.textContent?.slice(0, 400)}`);
  }
  input.focus();
  input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur'));
  await fixture.whenStable();
}
