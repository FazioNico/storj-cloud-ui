export interface MediaFileInterface {
  name: string;
  parent: string;
  isFolder: boolean;
  type?: string;
  created?: Date
  lastModified?: Date
  size?: number;
  url?: string;
  _aid?: string;
  _id?: string;
}

export class MediaFile implements MediaFileInterface {
  public name!: string;
  public parent!: string;
  public isFolder!: boolean;
  public type?: string;
  public created?: Date
  public lastModified?: Date
  public size?: number;
  public url?: string;
  public _aid?: string;
  public _id?: string;

  constructor(params: Partial<MediaFileInterface>) {
    if (!params?.name) {
      throw new Error('Name is required');
    }
    Object.assign(this, params);
    if (this.isFolder !== true) this.isFolder = false;
  }

}
