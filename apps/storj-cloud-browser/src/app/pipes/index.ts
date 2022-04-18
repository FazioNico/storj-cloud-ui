import { IsCurrentBucketPipe } from './is-current-bucket.pipe';
import { FileNamePipe } from './file-name.pipe';
import { BytesToSizePipe } from './bytes-to-size.pipe';

export const PIPES = [
  IsCurrentBucketPipe,
  FileNamePipe,
  BytesToSizePipe
];