declare module '*.scss' {
  export const classes: { [key: string]: string };
  export default classes;
}
declare module '*.css' {
  export const classes: { [key: string]: string };
  export default classes;
}

declare module 'element.form.*.ts' {
  export const componentName: string;
}
