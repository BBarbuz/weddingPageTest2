# Atelier Gracja — prezentacja sukien (proof of concept)

Statyczna strona-wizytówka z kolekcją sukien, inspirowana układem sklepów typu Azazie.
**Bez backendu**: koszyk i ulubione zapisują się tylko w przeglądarce (localStorage), a „Przejdź do kasy” pokazuje komunikat demo.

## Uruchomienie

Wystarczy otworzyć `index.html` w przeglądarce. Można też wrzucić repo na GitHub Pages / Netlify — nic nie trzeba budować.

## Co jest na stronie

- hero z kolekcją, pasek atutów, sekcja „Przymiarka”, stopka
- katalog z kategoriami (ślubne / druhny / wieczorowe), wyszukiwarką, sortowaniem i filtrami (sylwetka, dekolt, kolor, cena) z licznikami
- karty z wyborem koloru, serduszkiem „ulubione”, plakietkami (Nowość, Bestseller, promocja) i podglądem detalu po najechaniu
- szybki podgląd sukni: galeria (całość / gorset / dół), kolory, rozmiary + „Na wymiar”, tabela rozmiarów, szczegóły
- koszyk w wysuwanym panelu: ilości, usuwanie, pasek darmowej dostawy, podsumowanie
- wersja mobilna (menu, filtry i podgląd jako panele)

## Jak dodać własne suknie i zdjęcia

Wszystkie dane są w `js/products.js`. Każda suknia to jeden obiekt (nazwa, cena, kolory, opis…).

Domyślnie suknie są rysowane jako ilustracje SVG (`js/dress-art.js`). Żeby pokazać prawdziwe zdjęcia,
wrzuć je np. do folderu `img/` i dodaj do sukni pole:

```js
photos: ['img/aurelia-1.jpg', 'img/aurelia-2.jpg', 'img/aurelia-3.jpg'],
```

1. zdjęcie = cała suknia, 2. = detal / gorset (pokazuje się po najechaniu), 3. = dół / tren. Najlepiej w proporcjach 3:4.

## Pliki

- `index.html` — struktura strony
- `css/styles.css` — wygląd (kolory i fonty w zmiennych na początku pliku)
- `js/products.js` — dane kolekcji
- `js/dress-art.js` — generator ilustracji sukien
- `js/app.js` — filtry, podgląd, ulubione, koszyk
