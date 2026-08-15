import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../common/enums';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) password: string;
  @Column() fullName: string;
  @Column({ type: 'enum', enum: UserRole, array: true, default: [UserRole.ADVISOR] }) roles: UserRole[];
  @Column({ default: true }) isActive: boolean;
  @BeforeInsert() @BeforeUpdate() normalizeEmail() { this.email = this.email.toLowerCase().trim(); }
}
