# Rodinná Sieť

Súkromná rodinná sociálna sieť postavená na React 19 a Firebase.

## Nastavenie

### Požiadavky
- Node.js (v16 alebo novší)
- npm alebo yarn
- Firebase projekt

### Inštalácia

1. Naklonujte repozitár:
```bash
git clone [your-repo-url]
cd rodinna-siet
```

2. Nainštalujte závislosti:
```bash
npm install
```

3. Nastavte Firebase konfiguráciu:
```bash
cp .env.example .env.local
```

4. Upravte `.env.local` so svojimi Firebase údajmi:
- Vytvorte Firebase projekt na https://console.firebase.google.com
- Aktivujte Authentication, Firestore a Storage
- Skopírujte konfiguračné údaje do `.env.local`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run deploy`

Builds and deploys the app to Firebase Hosting in one command.

## Bezpečnosť

⚠️ **DÔLEŽITÉ BEZPEČNOSTNÉ POKYNY:**

- **NIKDY** necommitujte `.env.local` súbor do Git - obsahuje citlivé Firebase údaje
- Firebase konfiguračné kľúče sú citlivé informácie
- Používajte `.env.example` ako šablónu pre nových vývojárov
- Súbor `.env` s placeholder hodnotami je vylúčený z Git

## Technológie

- **React 19.1.1** - Frontend framework
- **Firebase 12.1.0** - Backend-as-a-Service (Auth, Firestore, Storage, Hosting)
- **Tailwind CSS 3.4.17** - CSS framework s dark mode
- **Font Awesome 6.5.1** - Ikony
- **React Router DOM 7.8.2** - Client-side routing

## iPhone Safari Kompatibilita

Aplikácia obsahuje špeciálne riešenia pre iPhone Safari problémy:
- Automatická detekcia iPhone a použitie polling namiesto real-time Firebase listeners
- Špeciálne touch event handling pre interaktívne tlačidlá
- Riešenie problémov s file input elementmi pomocou label/input pattern
- WebKit-specific CSS vlastnosti pre lepšiu touch responsivitu

Viac detailov v [CLAUDE.md](./CLAUDE.md)

## Live URL
https://rodinna-siet.web.app
