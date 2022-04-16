import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileName'
})
export class FileNamePipe implements PipeTransform {

  transform(value: string): string {
    // clear file name
    if (value.includes('/.file_placeholder')) {
      value =  value.replace('/.file_placeholder', '');
    }
    value = value.split('/').pop()||value;
    return value;
  }

}
