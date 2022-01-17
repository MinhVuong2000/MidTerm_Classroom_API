const db = require('../utils/connectDB');
const users_db = require('../models/users.js');
const classes_db = require('../models/classes.js');
const assignments_db = require('../models/assignments.js');
const user_assignments_db = require('./user_assignments');
const moment = require('moment');
module.exports = {
    all(){
        return db('review_grade');
    },

    async one(id){
        const items = await db('review_grade').where('id', id);
        if (items.length===0)
            return null;
        let item = items[0];
        item.student = await users_db.oneIDUni(item.id_user_uni, false);
        item.assignment = await assignments_db.one(item.id_assignment);
        item.class = await classes_db.one(item.id_class, item.id_user_uni);
        console.log(item);
        return item;
    },

    add(new_review) {
        return db('review_grade').insert(new_review);
    },

    updateStatus(id, new_status){
        return db('review_grade').where('id', id).update('status', new_status);
    },
    async getStatus(idAssignment, id_uni){
        item = await db('review_grade').where({
            id_assignment: idAssignment,
            id_user_uni: id_uni
        });
        if(item.length > 0){
            return item[0];
        }
        return null;
    },
    async findReviewByUserAssignment(id_uni, id_assignment){
        const items = await db('review_grade').where({
            id_user_uni: id_uni,
            id_assignment: id_assignment
        });
        if (items.length===0)
            return null;
        let item = {};
        item.review = items[0];
        item.student = await users_db.oneIDUni(items[0].id_user_uni, false);
        item.assignment = await assignments_db.one(items[0].id_assignment);
        item.class = await classes_db.one(items[0].id_class, items[0].id_user_uni);
        return item;
    },
    async findReviewByIDClass(id_class){
        const items = await db('review_grade').where({
            id_class: id_class
        });
        if (items.length===0)
            return null;
        let list_news = [];
        for(i = 0; i<items.length; i++){
            let temp = {};
            temp.id_review = items[i].id;
            temp.student_id = items[i].id_user_uni;
            temp.id_assignment = items[i].id_assignment;
            temp.current_grade = items[i].current_grade;
            temp.expect_grade = items[i].expect_grade;
            temp.explain = items[i].explain;
            temp.status = items[i].status;
            temp.time = moment(items[i].create_time).format("DD/MM/YYYY HH:mm:ss");
            let nameassign = await db('assignments').where({
                id: items[i].id_assignment
            })
            if(nameassign.length > 0){
                temp.name_assignment = nameassign[0].name;
            }
            let studentname = await db('users').where({
                id_uni: items[i].id_user_uni
            })
            if(studentname.length > 0){
                temp.student_name = studentname[0].full_name;
            }
            list_news.push(temp);
        }
        console.log("Database list news teacher: ",list_news);
        return list_news;
    },
    async findReviewGradeByUserAssignment(id_uni, id_assignment){
        const items = await db('review_grade').where({
            id_user_uni: id_uni,
            id_assignment: id_assignment
        });
        if (items.length===0)
            return null;
        let item = items[0];
        if(item.status == -1){
            return null;
        }
        let grade = await user_assignments_db.find1ScoreByIDAssignmentUser(id_assignment, id_uni);
        if(grade == null){
            return null;
        }
        return grade.grade;
    },
    async findGradeAfterTeacherByIdReview(id_review){
        const items = await db('review_grade').where({
            id: id_review
        });
        if (items.length===0)
            return null;
        let item = items[0];
        if(item.status == -1){
            return null;
        }
        let grade = await user_assignments_db.find1ScoreByIDAssignmentUser(item.id_assignment, item.id_user_uni);
        if(grade == null){
            return null;
        }
        return grade.grade;
    },
}