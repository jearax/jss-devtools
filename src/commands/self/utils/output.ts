import consola from 'consola';

export const printJson = (result: object): void => {
  consola.log(JSON.stringify(result, null, 2));
};
