import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[dStoreDropable]'
})
export class DropableDirective {

  @HostBinding('class.fileover') fileOver!: boolean;
  @HostBinding('class.filedrop') fileDrop!: boolean;
  @Output() fileDropped = new EventEmitter<{target: {files: FileList}}>();

  @HostListener('dragover', ['$event']) onDragOver(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.fileOver = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.fileOver = false;
  }

  @HostListener('drop', ['$event']) onDrop(e: MouseEvent & { dataTransfer?: DataTransfer }) {
    e.preventDefault();
    e.stopPropagation();
    const files = e?.dataTransfer?.files;
    if (!files) {
      return;
    }
    this.fileOver = false;
    if(files.length > 0) {
      const target = this.ref.nativeElement;
      target.files = files;
      this.fileDropped.emit({target})
      this.fileDrop = true;
      console.log(`You have choosen ${files.length} files`)
    }
    
  }

  constructor(
    private ref: ElementRef
  ) { 

  }
}
