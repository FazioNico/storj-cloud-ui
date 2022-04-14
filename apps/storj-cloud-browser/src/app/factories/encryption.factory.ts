import { DataStorageProviderInterface } from '@storj-cloud-ui/interfaces';
import { AES as cryptoAES, enc } from 'crypto-js';

export const databaseEncryptionFactory = (encryptionKey: string, d: DataStorageProviderInterface): DataStorageProviderInterface => {

  const encrypt = async <T>(data: T) => {
    const value = JSON.stringify(data);
    const encrypted = await cryptoAES.encrypt(value, encryptionKey).toString();
    return encrypted;
  };
  const decrypt = async (encrypted: string) => {
    const decrypted = await cryptoAES.decrypt(encrypted, encryptionKey).toString(enc.Utf8);
    return decrypted;
  };
  // return function
  return {
    _isEncrypted: true,
    getData: async <T>(key: string) => {
      const encrypted = await d.getData<string>(key);
      if (!encrypted) {
        return undefined;
      }
      const decrypted = await decrypt(encrypted);
      try {
        return JSON.parse(decrypted) as T;
      } catch (error) {
        console.log('[ERROR] databaseEncryptionFactory: ', error);
        return undefined;
      }
    },
    saveData: async <T>(key: string, data: T) => {
      const encrypted = await encrypt(data);
      return d.saveData(key, encrypted);
    },
    removeData: async (key: string) => {
      return d.removeData(key);
    },
  } as DataStorageProviderInterface;
};