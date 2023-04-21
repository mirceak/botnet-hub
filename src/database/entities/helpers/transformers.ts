export const ArrayTransformer = () =>
  ({
    type: 'text',
    transformer: {
      from: (value: string) => value.split(','),
      to: (value: string[]) => value.join(',')
    }
  } as const);
