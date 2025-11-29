export class DataTransformer {
  static normalize(data: any): any {
    if (Array.isArray(data)) return data.map(d => this.normalize(d));
    if (data === null || typeof data !== 'object') return data;
    return Object.keys(data).reduce((acc, key) => {
      acc[key.toLowerCase()] = this.normalize(data[key]);
      return acc;
    }, {} as any);
  }

  static flatten(data: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in data) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof data[key] === 'object' && data[key] !== null) {
        Object.assign(result, this.flatten(data[key], newKey));
      } else {
        result[newKey] = data[key];
      }
    }
    return result;
  }

  static pick(data: any, fields: string[]): any {
    return fields.reduce((acc, field) => {
      acc[field] = data[field];
      return acc;
    }, {} as any);
  }

  static omit(data: any, fields: string[]): any {
    const result = { ...data };
    fields.forEach(field => delete result[field]);
    return result;
  }
}
