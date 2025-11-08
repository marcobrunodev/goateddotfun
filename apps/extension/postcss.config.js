export default {
  plugins: {
    tailwindcss: {},
    '@thedutchcoder/postcss-rem-to-px': {
      // Converte rem para px para funcionar corretamente no Shadow DOM
      propList: ['*'],
    },
    autoprefixer: {},
  },
};
