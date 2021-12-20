-- Database: new_classroom

-- DROP DATABASE IF EXISTS new_classroom;


-- Database: classroom

--DROP DATABASE IF EXISTS classroom;
DROP TABLE IF EXISTS user_assignments;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS class_user;
CREATE TABLE class_user (
  "id_class" int4 NOT NULL,
  "id_uni_user" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "is_teacher" bool NOT NULL,
  "full_name_user" varchar(255) COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Records of Class_User
-- ----------------------------
BEGIN;
INSERT INTO class_user VALUES (1, '123', TRUE, 'Nguyễn Văn A');
INSERT INTO class_user VALUES (1, '124', FALSE, 'Võ Xuân Đức Thắng');
INSERT INTO class_user VALUES (1, '111', FALSE, 'Lê Văn Lượng');
INSERT INTO class_user VALUES (2, '124', FALSE, 'Huỳnh Văn Minh');
INSERT INTO class_user VALUES (2, '123', FALSE, 'Lê Thị Tuyết Trinh');
INSERT INTO class_user VALUES (2, '321', TRUE, 'Nguyễn Thị Minh Vượng');
INSERT INTO class_user VALUES (3, '123', FALSE, 'Nguyễn Văn A');
INSERT INTO class_user VALUES (3, '321', FALSE, 'Nguyễn Thị Minh Vượng');
INSERT INTO class_user VALUES (3, '312', TRUE, 'Lê Thị Tuyết Trinh');
COMMIT;

-- ----------------------------
-- Table structure for Classes
-- ----------------------------
DROP TABLE IF EXISTS classes;
CREATE TABLE classes (
  "id" int4 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 6
),
  "class_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "id_admin" int4 NOT NULL,
  "invitation_link" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of Classes
-- ----------------------------
BEGIN;
INSERT INTO classes OVERRIDING SYSTEM VALUE VALUES (1, 'PTUDW', 'Môn học cơ bản về back end', 2, NULL);
INSERT INTO classes OVERRIDING SYSTEM VALUE VALUES (2, 'PTUDWNC', 'Học cách phát triển front end', 3, NULL);
INSERT INTO classes OVERRIDING SYSTEM VALUE VALUES (3, 'PTUDDD', 'Xây dựng ứng dụng cho thiết bị di động', 4, NULL);
COMMIT;

-- ----------------------------
-- Table structure for Users
-- ----------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  "id" int4 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 5
),
  "full_name" varchar(255),
  "username" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "id_uni" varchar(50) COLLATE "pg_catalog"."default",
  "address" varchar(255),
  "email" varchar(255),
  "phone" varchar(50),
	"otp" int4
)
;

-- ----------------------------
-- Records of Users
-- ----------------------------
BEGIN;
INSERT INTO users OVERRIDING SYSTEM VALUE VALUES (1, 'Nguyễn Văn A', 'a_nguyenvan', '$2a$10$ij.inENEdLH4K52o/c1bKec3dXDdHybpxdVcEH6bCK8W8ygi866L.', '123', NULL, NULL, NULL, -1);
INSERT INTO users OVERRIDING SYSTEM VALUE VALUES (2, 'Võ Xuân Đức Thắng', 'thang_123', '$2a$10$ij.inENEdLH4K52o/c1bKec3dXDdHybpxdVcEH6bCK8W8ygi866L.', '124', NULL, NULL, NULL, -1);
INSERT INTO users OVERRIDING SYSTEM VALUE VALUES (3, 'Nguyễn Thị Minh Vượng', 'vuong_321', '$2a$10$ij.inENEdLH4K52o/c1bKec3dXDdHybpxdVcEH6bCK8W8ygi866L.', '321', NULL, NULL, NULL, -1);
INSERT INTO users OVERRIDING SYSTEM VALUE VALUES (4, 'Lê Thị Tuyết Trinh', 'trinh_312', '$2a$10$ij.inENEdLH4K52o/c1bKec3dXDdHybpxdVcEH6bCK8W8ygi866L.', '312', NULL, NULL, NULL, -1);
COMMIT;

-- ----------------------------
-- Table structure for assignments
-- ----------------------------

CREATE TABLE assignments (
  "id" int4 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 10
),
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "point" int4 NOT NULL,
  "id_class" int4 NOT NULL,
  "orders" int4,
  "showgrade" bool
)
;

CREATE TABLE user_assignments (
    "id_user_uni" int4 NOT NULL,
    "id_assignment" int4 NOT NULL,
    "id_class" int4 NOT NULL,
    "grade" int4
);

-- ----------------------------
-- Records of assignments
-- ----------------------------
BEGIN;
INSERT INTO assignments OVERRIDING SYSTEM VALUE VALUES (1, 'Midterm', 4, 1, 0, true);
INSERT INTO assignments OVERRIDING SYSTEM VALUE VALUES (2, 'Midterm', 5, 2, 0, false);
INSERT INTO assignments OVERRIDING SYSTEM VALUE VALUES (3, 'Create Clone Classroom', 2, 3, 1, false);
INSERT INTO assignments OVERRIDING SYSTEM VALUE VALUES (4, 'Bai tap 1', 2, 3, 2, false);
INSERT INTO assignments OVERRIDING SYSTEM VALUE VALUES (5, 'Bai tap 2', 3, 3, 3, true);
COMMIT;

-- ----------------------------
-- Records of assignments
-- ----------------------------
BEGIN;
INSERT INTO user_assignments OVERRIDING SYSTEM VALUE VALUES (123, 3, 3, 8);
INSERT INTO user_assignments OVERRIDING SYSTEM VALUE VALUES (321, 3, 3, 7);
INSERT INTO user_assignments OVERRIDING SYSTEM VALUE VALUES (123, 4, 3, 4);
INSERT INTO user_assignments OVERRIDING SYSTEM VALUE VALUES (123, 5, 3, 6);
INSERT INTO user_assignments OVERRIDING SYSTEM VALUE VALUES (321, 4, 3, 7);
INSERT INTO user_assignments OVERRIDING SYSTEM VALUE VALUES (321, 5, 3, 9);
COMMIT;


-- ----------------------------
-- Primary Key structure for table Class_User
-- ----------------------------
ALTER TABLE class_user ADD CONSTRAINT "Class_User_pkey" PRIMARY KEY ("id_class", "id_uni_user");

-- ----------------------------
-- Uniques structure for table Classes
-- ----------------------------
ALTER TABLE classes ADD CONSTRAINT "CLASS_NAME" UNIQUE ("class_name");

-- ----------------------------
-- Primary Key structure for table Classes
-- ----------------------------
ALTER TABLE classes ADD CONSTRAINT "Classes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table Users
-- ----------------------------
ALTER TABLE users ADD CONSTRAINT "USERNAME" UNIQUE ("username");

-- ----------------------------
-- Primary Key structure for table Users
-- ----------------------------
ALTER TABLE users ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table Class_User
-- ----------------------------
ALTER TABLE class_user ADD CONSTRAINT "ID_CLASS_CLASSUSERCLASS" FOREIGN KEY ("id_class") REFERENCES classes ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table Classes
-- ----------------------------
ALTER TABLE classes ADD CONSTRAINT "ADMIN_CLASSUSER" FOREIGN KEY ("id_admin") REFERENCES users ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Primary Key structure for table assignments
-- ----------------------------
ALTER TABLE assignments ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table assignments
-- ----------------------------
ALTER TABLE assignments ADD CONSTRAINT "ID_CLASS_ASSIGNMENT" FOREIGN KEY ("id_class") REFERENCES classes ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Primary Key structure for table user_assignments
-- ----------------------------
ALTER TABLE user_assignments ADD CONSTRAINT "user_assignments_pkey" PRIMARY KEY ("id_user_uni", "id_assignment", "id_class");

-- ----------------------------
-- Foreign Keys structure for table assignments
-- ----------------------------
ALTER TABLE user_assignments ADD CONSTRAINT "ID_UserAssigments_ASSIGNMENT" FOREIGN KEY ("id_assignment") REFERENCES assignments ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE user_assignments ADD CONSTRAINT "ID_UserAssigments_Class" FOREIGN KEY ("id_class") REFERENCES classes ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--ALTER TABLE user_assignments ADD CONSTRAINT "ID_UserAssigments_User" FOREIGN KEY ("id_user_uni") REFERENCES users ("id_uni") ON DELETE CASCADE ON UPDATE CASCADE;
