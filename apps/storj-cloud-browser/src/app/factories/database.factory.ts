import { DataStorageProviderInterface } from "@storj-cloud-ui/interfaces";

export const databaseFactory = (d: Document): DataStorageProviderInterface => {
  if (!d?.defaultView?.localStorage) {
    throw new Error('localStorage is not defined');
  }
  const storage = d.defaultView.localStorage;
  return {
    getData: async (key: string) => {
      const d = await storage.getItem(key);
      try {
        return d ? JSON.parse(d) : undefined;
      } catch (error) {
        console.log('[ERROR] databaseFactory: ', error);
        return undefined;
      }
    },
    saveData: async <T>(key: string, data: T) => {
      try {
        const value = JSON.stringify(data);
        await storage.setItem(key, value);
        return true;
      } catch (error) {
        console.log('[ERROR] databaseFactory: ', error);
        return false;
      }
    },
    removeData: async (key: string) => {
      await storage.removeItem(key);
      return true;
    },
  };
};
