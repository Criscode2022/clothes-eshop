import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-atelier',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './atelier.html',
})
export class Atelier {}
