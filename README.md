# Vera Admin

Panel webowy do zarządzania organizacją Very. Loguje się do tego samego **Vera-API**.

## Start

W `Vera-API`:

```sh
npm run dev
```

W tym katalogu:

```sh
cp .env.example .env
npm install
npm run dev
```

Aplikacja: [http://127.0.0.1:5174](http://127.0.0.1:5174)

Pierwsze konto: login `admin`, hasło `admin`. Po zalogowaniu podajesz prawdziwy e-mail i ustawiasz hasło z linku. Bez SMTP link jest w logach API.

Potem logowanie tylko tym e-mailem. Reset hasła ze strony logowania.

## Widoki

- **Administratorzy** — kto ma dostęp do panelu
- **Użytkownicy** — konta komunikatora (tworzenie, usuwanie, zmiana loginu i hasła)
