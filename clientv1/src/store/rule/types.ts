import { Model } from '@/store/types'

export interface Rule extends Model {
  id: string;
  value: string;
}