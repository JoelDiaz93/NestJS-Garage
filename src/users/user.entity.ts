import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../common/enums';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) password: string;
  @Column() fullName: string;
  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role_enum', array: true, default: [UserRole.ADVISOR] }) roles: UserRole[];
  @Column({ default: true }) isActive: boolean;
  @BeforeInsert() @BeforeUpdate() normalizeEmail() { this.email = this.email.toLowerCase().trim(); }
}
