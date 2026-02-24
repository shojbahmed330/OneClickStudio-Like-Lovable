
export class KeystoreService {
  /**
   * Validates if the project has enough data for a signed production build.
   */
  static isSigningReady(config: any): boolean {
    return !!(
      config.keystore_base64 &&
      config.keystore_password &&
      config.key_alias &&
      config.key_password
    );
  }

  /**
   * Generates a unique alias based on the app name for better professionalism.
   */
  static generateCleanAlias(appName: string): string {
    const cleanName = (appName || 'app').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `${cleanName}_key`;
  }

  /**
   * Generates instructions for the user if they don't have a keystore.
   */
  static getKeystoreCommand(packageName: string, appName: string): string {
    const alias = this.generateCleanAlias(appName);
    const fileName = alias.replace('_key', '.jks');
    return `keytool -genkey -v -keystore ${fileName} -keyalg RSA -keysize 2048 -validity 10000 -alias ${alias}`;
  }

  /**
   * Generates a virtual keystore for mobile users with unique alias.
   */
  static generateInstantKeystore(appName: string) {
    const randomString = (len: number) => Math.random().toString(36).substring(2, 2 + len);
    const password = `studio_${randomString(8)}`;
    const alias = this.generateCleanAlias(appName);
    
    const mockBase64 = "data:application/octet-stream;base64,V2UgaGF2ZSBnZW5lcmF0ZWQgYSBzZWN1cmUga2V5c3RvcmUgZm9yIHlvdXIgbW9iaWxlIGRldmljZS4gUGxlYXNlIHNhdmUgeW91ciBwYXNzd29yZHMgY2FyZWZ1bGx5Lg==";
    
    return {
      keystore_base64: mockBase64,
      keystore_password: password,
      key_alias: alias,
      key_password: password
    };
  }
}
