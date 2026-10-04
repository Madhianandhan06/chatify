# React + Vite

Tailwind CSS is integrated through the Vite plugin. Add utility classes to JSX
and import `src/index.css` in the app entry point (already configured).

Run the client with `npm run dev`; create a production build with `npm run build`.

## Deploying the frontend

Set the `VITE_API_URL` environment variable in Vercel to the deployed backend
URL (for example, `https://chatify-v10g.onrender.com`), then redeploy. For local
development, the client defaults to `http://localhost:3000`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
