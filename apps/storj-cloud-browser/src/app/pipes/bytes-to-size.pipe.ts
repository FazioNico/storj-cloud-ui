import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytesToSize'
})
export class BytesToSizePipe implements PipeTransform {

  transform(value?: string|number): string {
    if (!value) {
      return '';
    }
    const bytes = Number(value);
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
      return '0 Bytes';
    }
    // convert bytes to size
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    
  }

}
