export interface Department {
  id: number;
  code: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  application_id: number;
  parent_id: number;
}
