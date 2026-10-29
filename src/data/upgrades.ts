import { balance } from './balance'
export type UpgradeId = 'patience'|'blood'|'ward'
export const upgrades: {id:UpgradeId; name:string; description:string}[] = [
  {id:'patience',name:'Nhẫn nại',description:'Sau khi chờ, đòn kế tiếp gây thêm 3 sát thương. Cộng dồn khi chọn lại.'},
  {id:'blood',name:'Tàn hỏa hồi sinh',description:`Hồi ${balance.bloodHeal} HP khi hạ một địch. Cộng dồn khi chọn lại.`},
  {id:'ward',name:'Hộ thân',description:'Nhận 4 điểm chắn khi lần đầu vào mỗi phòng. Không cộng dồn chắn giữa các phòng.'},
]
