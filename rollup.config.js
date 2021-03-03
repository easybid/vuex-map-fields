import babel from 'rollup-plugin-babel';

export default {
  external: [`@vue/composition-api`],
  plugins: [
    babel(),
  ],
};
