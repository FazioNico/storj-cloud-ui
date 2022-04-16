import { IsCurrentBucketPipe } from './is-current-bucket.pipe';
import { FileNamePipe } from './file-name.pipe';

export * from './is-current-bucket.pipe';
export const PIPES = [
  IsCurrentBucketPipe,
  FileNamePipe
];