/**
 * Words the shop repeats: the floor's pieces, the countries it ships to, the states of an order,
 * and the sentences in its emails. English stays the key, so a missing line falls back to it.
 */
export const DOMAIN: Record<string, string> = {
  // Document
  'Marlow, a ready-to-wear shop. Browse the floor, check out as a guest, or sign in.':
    'Marlow, una tienda de ropa. Recorre la planta, paga como invitado o entra.',

  // Route titles
  'Shop | Marlow': 'Tienda | Marlow',
  'Category | Marlow': 'Categoría | Marlow',
  'Piece | Marlow': 'Prenda | Marlow',
  'Atelier | Marlow': 'Taller | Marlow',
  'Checkout | Marlow': 'Caja | Marlow',
  'Order | Marlow': 'Pedido | Marlow',
  'Sign in | Marlow': 'Entrar | Marlow',
  'Forgot your password | Marlow': 'Olvidaste tu contraseña | Marlow',
  'New password | Marlow': 'Nueva contraseña | Marlow',
  'Your account | Marlow': 'Tu cuenta | Marlow',
  'Your orders | Marlow': 'Tus pedidos | Marlow',
  'Desk | Marlow': 'Mostrador | Marlow',
  'Stock | Marlow': 'Existencias | Marlow',
  'Backoffice | Marlow': 'Administración | Marlow',
  'Pieces | Marlow': 'Prendas | Marlow',
  'New piece | Marlow': 'Nueva prenda | Marlow',
  'Closed | Marlow': 'Cerrado | Marlow',
  'Sandbox Bank (simulation)': 'Sandbox Bank (simulación)',

  // Language control
  Language: 'Idioma',
  English: 'Inglés',
  Spanish: 'Español',

  // Chrome that every page shares
  Menu: 'Menú',
  Main: 'Principal',
  Shop: 'Tienda',
  'Shop all': 'Toda la tienda',
  Outerwear: 'Abrigos',
  Knitwear: 'Punto',
  Trousers: 'Pantalones',
  Shirts: 'Camisas',
  Atelier: 'Taller',
  Desk: 'Mostrador',
  Backoffice: 'Administración',
  'Your account: ': 'Tu cuenta: ',
  'Your account': 'Tu cuenta',
  'Your orders': 'Tus pedidos',
  Orders: 'Pedidos',
  'Sign in': 'Entrar',
  'Sign out': 'Salir',
  'Signed out.': 'Sesión cerrada.',
  Bag: 'Bolsa',
  item: 'artículo',
  items: 'artículos',
  ', empty': ', vacía',
  Footer: 'Pie',
  Help: 'Ayuda',
  Account: 'Cuenta',
  'Shipping and payment': 'Envío y pago',
  'How an order leaves': 'Cómo sale un pedido',
  'Forgot your password': 'Olvidaste tu contraseña',
  'A small ready-to-wear floor. Prices in US dollars.':
    'Una planta pequeña de ropa. Precios en dólares.',
  'Shipping is $8.00, and free when the pieces total $200.00. Marlow never asks for a card number.':
    'El envío cuesta $8.00 y es gratis cuando las prendas suman $200.00. Marlow nunca pide un número de tarjeta.',
  'Loading the page': 'Cargando la página',
  Breadcrumb: 'Ruta',
  Checkout: 'Caja',
  Piece: 'Prenda',
  Stock: 'Existencias',
  Closed: 'Cerrado',

  // Pieces, as the floor and the emails name them. The database keeps the English.
  'Charcoal Wool Overcoat': 'Abrigo de lana carbón',
  'A heavy wool coat, cut long, with a horn button and a full lining.':
    'Abrigo de lana gruesa, largo, con botón de asta y forro completo.',
  'Camel Field Jacket': 'Chaqueta de campo camello',
  'Cotton twill, unlined, with a throat latch and deep pockets.':
    'Sarga de algodón, sin forro, con trabilla al cuello y bolsillos profundos.',
  'Merino Crew Neck': 'Jersey de merino',
  'Fine merino, knitted tight enough to sit under a jacket.':
    'Merino fino, de punto cerrado, para llevar bajo una chaqueta.',
  'Ribbed Cardigan': 'Cárdigan de canalé',
  'A long rib, oat yarn, with horn buttons and a patch pocket.':
    'Canalé largo, hilo avena, con botones de asta y un bolsillo de parche.',
  'Pleated Wool Trouser': 'Pantalón de lana con pinzas',
  'A single forward pleat, full through the thigh, plain hem.':
    'Una pinza delantera, amplio en el muslo, bajo recto.',
  'Wide Cotton Trouser': 'Pantalón ancho de algodón',
  'Stone cotton with a wide leg and a flat front.':
    'Algodón piedra, pernera ancha y delantero liso.',
  'Oxford Cloth Shirt': 'Camisa de oxford',
  'White oxford, button-down collar, a workroom staple.':
    'Oxford blanco, cuello button-down, una prenda de taller.',
  'Silk Tunic': 'Túnica de seda',
  'Ivory silk, dropped shoulder, meant to be worn untucked.':
    'Seda marfil, hombro caído, para llevar por fuera.',

  '100% wool melton, cupro lining.': 'Paño de lana 100 %, forro de cupro.',
  'Brush and air it. Press with a cloth. Dry clean when the lining dulls.':
    'Cepílalo y airéalo. Plánchalo con un paño. Limpieza en seco cuando el forro pierda brillo.',
  'Cotton twill, unlined.': 'Sarga de algodón, sin forro.',
  'Cold wash, hang dry, and press the collar flat.':
    'Lavado en frío, tendido y cuello planchado.',
  'Extrafine merino wool.': 'Lana merino extrafina.',
  'Hand wash cold and dry flat. Do not tumble.':
    'Lavado a mano en frío y en horizontal. No uses secadora.',
  'Wool and cotton rib.': 'Canalé de lana y algodón.',
  'Hand wash cold, reshape the rib, and dry flat.':
    'Lavado a mano en frío, recupera el canalé y sécalo en horizontal.',
  'Wool twill.': 'Sarga de lana.',
  'Steam the pleat from the inside. Dry clean.':
    'Da vapor a la pinza por el revés. Limpieza en seco.',
  'Washed cotton.': 'Algodón lavado.',
  'Machine wash cold and hang dry. Press a crease only if you want one.':
    'Lavado a máquina en frío y tendido. Marca la raya solo si la quieres.',
  'Oxford cotton cloth.': 'Tela de algodón oxford.',
  'Machine wash warm, hang dry, and press the collar while it is damp.':
    'Lavado a máquina en tibio, tendido, y plancha el cuello mientras está húmedo.',
  'Silk twill.': 'Sarga de seda.',
  'Dry clean. Steam from the inside.': 'Limpieza en seco. Vapor por el revés.',

  'Coat sizes are European chest sizes. The overcoat is cut to clear a knit. Between two sizes, take the larger.':
    'Las tallas de abrigo son de pecho europeas. El abrigo deja sitio a un punto. Entre dos tallas, la mayor.',
  'Letter sizes follow the body, not the coat. The merino sits close. The cardigan has ease through the sleeve.':
    'Las tallas de letra siguen el cuerpo, no el abrigo. El merino queda cerca. El cárdigan tiene holgura en la manga.',
  'Waist sizes use the same numbers as the coats. The pleated wool is full in the thigh. The cotton is straight from the hip.':
    'La cintura usa los mismos números que los abrigos. La lana con pinzas es amplia en el muslo. El algodón cae recto desde la cadera.',
  'The oxford is a dress-shirt fit. The silk tunic is cut loose and meant to be worn untucked.':
    'El oxford tiene corte de camisa. La túnica de seda es holgada y se lleva por fuera.',

  Charcoal: 'Carbón',
  Camel: 'Camello',
  Ink: 'Tinta',
  Oat: 'Avena',
  Stone: 'Piedra',
  White: 'Blanco',
  Ivory: 'Marfil',

  // Countries. The order stores the English name; the list shows this one.
  Americas: 'América',
  Europe: 'Europa',
  Asia: 'Asia',
  Argentina: 'Argentina',
  Brazil: 'Brasil',
  Canada: 'Canadá',
  Chile: 'Chile',
  Colombia: 'Colombia',
  Mexico: 'México',
  Peru: 'Perú',
  'United States': 'Estados Unidos',
  Austria: 'Austria',
  Belgium: 'Bélgica',
  Czechia: 'Chequia',
  Denmark: 'Dinamarca',
  Finland: 'Finlandia',
  France: 'Francia',
  Germany: 'Alemania',
  Greece: 'Grecia',
  Ireland: 'Irlanda',
  Italy: 'Italia',
  Netherlands: 'Países Bajos',
  Norway: 'Noruega',
  Poland: 'Polonia',
  Portugal: 'Portugal',
  Spain: 'España',
  Sweden: 'Suecia',
  Switzerland: 'Suiza',
  'United Kingdom': 'Reino Unido',
  China: 'China',
  'Hong Kong': 'Hong Kong',
  India: 'India',
  Indonesia: 'Indonesia',
  Israel: 'Israel',
  Japan: 'Japón',
  Malaysia: 'Malasia',
  Philippines: 'Filipinas',
  Singapore: 'Singapur',
  'South Korea': 'Corea del Sur',
  Taiwan: 'Taiwán',
  Thailand: 'Tailandia',
  Türkiye: 'Turquía',
  'United Arab Emirates': 'Emiratos Árabes Unidos',
  Vietnam: 'Vietnam',
  'Type to search': 'Escribe para buscar',
  'Show every country': 'Mostrar todos los países',
  Countries: 'Países',
  Country: 'País',
  'No country by that name. Marlow ships to the ones listed.':
    'Ningún país con ese nombre. Marlow envía a los de la lista.',

  'Postal code': 'Código postal',
  'ZIP code': 'Código ZIP',
  Postcode: 'Código postal',
  Eircode: 'Eircode',
  'PIN code': 'Código PIN',
  CEP: 'CEP',
  Province: 'Provincia',
  State: 'Estado',
  'Province or territory': 'Provincia o territorio',
  'State or union territory': 'Estado o territorio de la unión',
  Prefecture: 'Prefectura',

  // Address, as the form and the server say it.
  'Enter your full name.': 'Escribe tu nombre completo.',
  'Keep the name under {count} characters.': 'El nombre, en menos de {count} caracteres.',
  'Keep the name under 80 characters.': 'El nombre, en menos de 80 caracteres.',
  'Use letters for the name.': 'Usa letras en el nombre.',
  'Enter an email for the receipt.': 'Escribe un correo para el recibo.',
  'Enter an email address, like name@example.com.':
    'Escribe un correo, como nombre@ejemplo.com.',
  'Enter a phone number.': 'Escribe un teléfono.',
  'Use digits for the phone number, with + only at the start.':
    'Usa dígitos en el teléfono, con + solo al principio.',
  'Enter a phone number with {min} to {max} digits.':
    'Escribe un teléfono de {min} a {max} dígitos.',
  'Enter a phone number with 7 to 15 digits.': 'Escribe un teléfono de 7 a 15 dígitos.',
  'Choose the country to send it to.': 'Elige el país de destino.',
  'Choose a country from the list.': 'Elige un país de la lista.',
  'Enter the street and number, like 12 Loom Street.':
    'Escribe la calle y el número, como Calle Telar 12.',
  'Enter the city.': 'Escribe la ciudad.',
  'Use letters for the city.': 'Usa letras en la ciudad.',
  'Enter the address to ship to.': 'Escribe la dirección de envío.',
  'Enter your name, at least 2 letters.': 'Escribe tu nombre, al menos 2 letras.',

  // How an order moves, and what the desk's buttons say.
  'Order placed': 'Pedido hecho',
  'Being prepared': 'En preparación',
  'On its way': 'En camino',
  'Ready to pick up': 'Listo para recoger',
  Delivered: 'Entregado',
  'Picked up': 'Recogido',
  Cancelled: 'Cancelado',
  Placed: 'Hecho',
  'Start preparing': 'Empezar a preparar',
  'Mark shipped': 'Marcar enviado',
  'Mark ready to pick up': 'Marcar listo para recoger',
  'Mark delivered': 'Marcar entregado',
  'Mark picked up': 'Marcar recogido',
  Cancel: 'Cancelar',
  ', done': ', hecho',
  'Order progress': 'Progreso del pedido',

  'We have your order and will start preparing it soon.':
    'Ya tenemos tu pedido y empezaremos a prepararlo pronto.',
  'We are gathering your pieces and packing them in the workroom.':
    'Estamos reuniendo tus prendas y empaquetándolas en el taller.',
  'We are gathering your pieces and setting them aside at the counter.':
    'Estamos reuniendo tus prendas y dejándolas en el mostrador.',
  'Your parcel has left the shop for {city}.': 'Tu paquete ha salido de la tienda hacia {city}.',
  you: 'ti',
  'Your parcel was delivered to {line1}, {city}.': 'Tu paquete se entregó en {line1}, {city}.',
  'Your parcel was delivered.': 'Tu paquete se entregó.',
  'Your pieces are waiting at the counter. Give the reference {reference} when you come, and pay there.':
    'Tus prendas te esperan en el mostrador. Di la referencia {reference} cuando vengas, y paga allí.',
  'Your pieces are waiting at the counter. Give the reference {reference} when you come.':
    'Tus prendas te esperan en el mostrador. Di la referencia {reference} cuando vengas.',
  'You picked up this order at the shop.': 'Recogiste este pedido en la tienda.',
  'This order was cancelled, and its pieces went back on the floor.':
    'Este pedido se canceló y sus prendas volvieron a la planta.',

  'Ship to an address': 'Enviar a una dirección',
  Ship: 'Enviar',
  'Pick up at the shop': 'Recoger en la tienda',
  'Pick up': 'Recoger',
  'Pay at the shop': 'Pagar en la tienda',
  'Bank transfer': 'Transferencia',
  'Cash when it arrives': 'Efectivo al llegar',
  'shipped to an address': 'enviado a una dirección',
  'picked up at the shop': 'recogido en la tienda',
  'Pay at the shop is only for orders picked up at the shop.':
    'Pagar en la tienda es solo para pedidos recogidos en la tienda.',
  'Cash when it arrives is only for orders shipped to an address.':
    'Efectivo al llegar es solo para pedidos enviados a una dirección.',

  'In stock': 'En existencias',
  'Sold out': 'Agotado',
  'Only {count} left': 'Quedan {count}',
  'Only 1 left': 'Queda 1',
  'Only 2 left': 'Quedan 2',
  'That size is out of stock.': 'Esa talla está agotada.',
  'That quantity is not available.': 'Esa cantidad no está disponible.',
  piece: 'prenda',
  pieces: 'prendas',
  order: 'pedido',
  orders: 'pedidos',
  'Skip to main content': 'Saltar al contenido',
  'Free shipping from $200.': 'Envío gratis desde $200.',
  'No card needed: pay at the shop, in cash on delivery, or by bank transfer through a secure platform.':
    'Sin tarjeta: paga en la tienda, en efectivo al llegar, o por transferencia en una plataforma segura.',
  Dismiss: 'Cerrar',
  Paid: 'Pagado',
  'Payment pending': 'Pago pendiente',
  Free: 'Gratis',
  Subtotal: 'Subtotal',
  Shipping: 'Envío',
  Total: 'Total',
  Payment: 'Pago',
  'Add {amount} more for free shipping.': 'Añade {amount} más para el envío gratis.',
  'Shipping is free on this order.': 'El envío es gratis en este pedido.',
  'Toward free shipping': 'Hacia el envío gratis',
  'Monday to Saturday, 10 am to 7 pm': 'De lunes a sábado, de 10 a 19 h',
  'Monday to Saturday, 10 am to 7 pm.': 'De lunes a sábado, de 10 a 19 h.',

  // What the server answers, in the same words the page shows.
  'The bag is empty.': 'La bolsa está vacía.',
  'Choose how the order reaches you.': 'Elige cómo llega el pedido.',
  'Choose how you will pay.': 'Elige cómo vas a pagar.',
  'Card numbers are not accepted. Choose a payment method instead.':
    'No aceptamos números de tarjeta. Elige una forma de pago.',
  'Quantity must be a whole number above zero.': 'La cantidad tiene que ser un número entero mayor que cero.',
  'Quantity must be a whole number.': 'La cantidad tiene que ser un número entero.',
  'That piece is no longer on the floor.': 'Esa prenda ya no está en la planta.',
  'That size is no longer on the floor.': 'Esa talla ya no está en la planta.',
  'Add a piece before checkout.': 'Añade una prenda antes de la caja.',
  'Sign in to see orders.': 'Entra para ver los pedidos.',
  'That order is not available.': 'Ese pedido no está disponible.',
  'Only shop staff can move an order.': 'Solo el personal puede mover un pedido.',
  'Sign in to cancel an order.': 'Entra para cancelar un pedido.',
  'This order is already cancelled.': 'Este pedido ya está cancelado.',
  'Only shop staff can change stock.': 'Solo el personal puede cambiar las existencias.',
  'Only the owner can change a price.': 'Solo la dirección puede cambiar un precio.',
  'Only the owner can add a piece.': 'Solo la dirección puede añadir una prenda.',
  'Choose a category from the floor.': 'Elige una categoría de la planta.',
  'Enter a name for the piece.': 'Escribe un nombre para la prenda.',
  'Only the owner can add a size or color.': 'Solo la dirección puede añadir una talla o un color.',
  'That size and color already exist.': 'Esa talla y ese color ya existen.',
  'Enter a size and a color.': 'Escribe una talla y un color.',
  'Enter a price in cents.': 'Escribe un precio en centavos.',
  'Stock must be a whole number.': 'Las existencias tienen que ser un número entero.',
  'That fulfillment state does not exist.': 'Ese estado de pedido no existe.',
  'The shop could not read that request.': 'La tienda no pudo leer esa solicitud.',
  'The shop could not finish that.': 'La tienda no pudo terminar eso.',
  'The shop could not place that order.': 'La tienda no pudo hacer ese pedido.',
  'The shop could not reach its records.': 'La tienda no pudo llegar a sus registros.',
  'That shop route does not exist.': 'Esa ruta de la tienda no existe.',
  'That session has ended. Sign in again.': 'Esa sesión terminó. Entra de nuevo.',
  'That payment link is not valid.': 'Ese enlace de pago no es válido.',
  'Sign in to change your account.': 'Entra para cambiar tu cuenta.',
  'Sign in to delete your account.': 'Entra para eliminar tu cuenta.',
  'The shop needs its database to change an account.':
    'La tienda necesita su base de datos para cambiar una cuenta.',
  'The shop needs its database to delete an account.':
    'La tienda necesita su base de datos para eliminar una cuenta.',
  'Staff accounts are closed by the owner, not from this page.':
    'Las cuentas del personal las cierra la dirección, no esta página.',
  'Enter your password again to delete the account.':
    'Escribe tu contraseña otra vez para eliminar la cuenta.',
  'Neon Auth could not finish that.': 'Neon Auth no pudo terminar eso.',
  'Neon Auth could not be reached.': 'No se pudo llegar a Neon Auth.',
  'Sign-in failed.': 'No se pudo entrar.',
  'The link could not be sent just now. Try again in a moment.':
    'El enlace no se pudo enviar ahora. Prueba en un momento.',
  'Choose English or Spanish.': 'Elige inglés o español.',

  // Emails. Placeholders keep the English sentence's shape.
  'Your Marlow order {reference}': 'Tu pedido de Marlow {reference}',
  'Thank you, {name}. Your order is placed.': 'Gracias, {name}. Tu pedido está hecho.',
  Order: 'Pedido',
  'Order {reference}': 'Pedido {reference}',
  '{color}, size {size}, {quantity} × {price}': '{color}, talla {size}, {quantity} × {price}',
  '{label}: {value}': '{label}: {value}',
  'Order {reference} is placed. Total {total}.': 'El pedido {reference} está hecho. Total {total}.',
  '{method}, pending until the transfer arrives. No card was taken.':
    '{method}, pendiente hasta que llegue la transferencia. No se tomó ninguna tarjeta.',
  '{method}. No card was taken.': '{method}. No se tomó ninguna tarjeta.',
  'Keep the reference: it is how the shop finds your order.':
    'Guarda la referencia: es como la tienda encuentra tu pedido.',
  'See your order': 'Ver tu pedido',
  'See your order: {url}': 'Ver tu pedido: {url}',
  'Ship to': 'Enviar a',
  'Pick up at': 'Recoger en',
  'We email you when it is ready to pick up.': 'Te escribimos cuando esté listo para recoger.',
  'is on its way': 'va de camino',
  'is ready to pick up': 'está listo para recoger',
  'Your order is on its way': 'Tu pedido va de camino',
  'Your order is ready to pick up': 'Tu pedido está listo para recoger',
  'Your order {news}': 'Tu pedido {news}',
  'Your Marlow order {reference} is on its way': 'Tu pedido de Marlow {reference} va de camino',
  'Your Marlow order {reference} is ready to pick up':
    'Tu pedido de Marlow {reference} está listo para recoger',
  'Pay at the shop: {total}, at the counter.': 'Pagar en la tienda: {total}, en el mostrador.',
  'Cash when it arrives: have {total} ready for the carrier.':
    'Efectivo al llegar: ten {total} listos para el repartidor.',
  'Bank transfer, paid.': 'Transferencia, pagada.',
  'Bank transfer, pending until the transfer arrives.':
    'Transferencia, pendiente hasta que llegue.',
  'Account name': 'Titular',
  IBAN: 'IBAN',
  BIC: 'BIC',
  Amount: 'Importe',
  'Reference to quote': 'Referencia a indicar',
  'Pay by bank transfer to:': 'Paga por transferencia a:',
  'Pay with {bank}': 'Pagar con {bank}',
  'Pay with {bank}: {url}': 'Pagar con {bank}: {url}',
  'This is a demo shop: the account is fictional, and the link opens {bank}, a simulated bank where no money moves. Once the transfer is sent, the order is marked paid.':
    'Esta es una tienda de demostración: la cuenta es ficticia y el enlace abre {bank}, un banco simulado donde no se mueve dinero. Cuando se envía la transferencia, el pedido queda pagado.',

  'Your Marlow account is open': 'Tu cuenta de Marlow está abierta',
  'Your account is open': 'Tu cuenta está abierta',
  'Hello {name},': 'Hola {name},',
  'Hello,': 'Hola,',
  'Your Marlow account for {email} is open.': 'Tu cuenta de Marlow para {email} está abierta.',
  'Orders you place while signed in are kept under your name.':
    'Los pedidos que hagas con la sesión abierta quedan a tu nombre.',
  'You can change your name or password, or delete the account, on Your account.':
    'Puedes cambiar tu nombre o tu contraseña, o eliminar la cuenta, en Tu cuenta.',
  'Your account: {url}': 'Tu cuenta: {url}',
  'Go to your account': 'Ir a tu cuenta',
  'If you did not create this account, choose a new password from the sign-in page and delete the account.':
    'Si no creaste esta cuenta, elige una contraseña nueva desde la página de entrada y elimina la cuenta.',

  'Choose a new Marlow password': 'Elige una contraseña nueva de Marlow',
  'Choose a new password': 'Elige una contraseña nueva',
  'Someone asked to reset the password of your Marlow account.':
    'Alguien pidió restablecer la contraseña de tu cuenta de Marlow.',
  'If it was not you, ignore this email: your password stays as it is.':
    'Si no fuiste tú, ignora este correo: tu contraseña sigue igual.',
  'Confirm your Marlow email': 'Confirma tu correo de Marlow',
  'Confirm your email': 'Confirma tu correo',
  'Open the link to confirm the email address of your Marlow account.':
    'Abre el enlace para confirmar el correo de tu cuenta de Marlow.',
  'Confirm the email': 'Confirmar el correo',
  'If you did not create a Marlow account, ignore this email.':
    'Si no creaste una cuenta de Marlow, ignora este correo.',
  'Your Marlow sign-in link': 'Tu enlace para entrar en Marlow',
  'Sign in to Marlow': 'Entra en Marlow',
  'Open the link to sign in to your Marlow account.':
    'Abre el enlace para entrar en tu cuenta de Marlow.',
  'If you did not ask to sign in, ignore this email.':
    'Si no pediste entrar, ignora este correo.',
  'The link works for {minutes} minutes.': 'El enlace funciona durante {minutes} minutos.',
  'Use this code to choose a new password for your Marlow account.':
    'Usa este código para elegir una contraseña nueva de tu cuenta de Marlow.',
  'Use this code to confirm the email address of your Marlow account.':
    'Usa este código para confirmar el correo de tu cuenta de Marlow.',
  'Use this code to sign in to your Marlow account.':
    'Usa este código para entrar en tu cuenta de Marlow.',
  'It works for {minutes} minutes.': 'Funciona durante {minutes} minutos.',
  'If you did not ask for it, ignore this email.': 'Si no lo pediste, ignora este correo.',
  'Your Marlow code: {code}': 'Tu código de Marlow: {code}',
  'Your code': 'Tu código',
  '{code}. It works for {minutes} minutes.': '{code}. Funciona durante {minutes} minutos.',

  'Quantity of {name}': 'Cantidad de {name}',
  'One fewer {name}': 'Una menos de {name}',
  'One more {name}': 'Una más de {name}',
  Size: 'Talla',
  Color: 'Color',
  Quantity: 'Cantidad',
  Email: 'Correo',
  Name: 'Nombre',
  Phone: 'Teléfono',
  Password: 'Contraseña',
  Search: 'Buscar',
  'Newest first': 'Más recientes',
  'Oldest first': 'Más antiguos',
  'Price, high to low': 'Precio, de mayor a menor',
  'Price, low to high': 'Precio, de menor a mayor',
  'Clear filters': 'Quitar filtros',
  Sort: 'Orden',
  Reference: 'Referencia',
};
