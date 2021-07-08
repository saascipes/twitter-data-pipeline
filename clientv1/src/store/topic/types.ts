import { Model } from '@/store/types'

export interface Topic extends Model {
  id: string;
  text: string;
  score: number;
}