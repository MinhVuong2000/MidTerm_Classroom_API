const express = require('express');
const router = express.Router();
const authMiddleWare = require('../../../../middlewares/auth_middleware.mdw');
const { updateOrderByIdAssignment, assignmentShowGrade } = require('../../../../models/assignments');
const assignments_db = require('../../../../models/assignments')
const user_assignment_db = require('../../../../models/user_assignments');
const class_user_db = require('../../../../models/class_user');
const review_db = require('../../../../models/review_grade');
const comment_db = require('../../../../models/comments');
const moment = require('moment')
//url: /detail/:id/assigments

router.get('/', async function(req, res) {
    //show list assignments
    //name, point
    const id_class = req.id_class;
    const items = await assignments_db.allInClass(id_class);
    await items.sort((firstItem, secondItem) => firstItem.orders - secondItem.orders);
    res.status(200).json(items)
});
//Tạo assignment mới sẽ mặc định điểm các sinh viên trong lớp là null (add ở bảng user_assignment)
router.post("/", authMiddleWare.isTeacherinClass, async function(req, res){
    
    const item = await assignments_db.findMaxOrderByIdclass(req.id_class);
    let maxOrder = 0;
    if(item != false){
        maxOrder = item.orders + 1;
    }
    new_assignment = {
        name: req.body.name,
        point: req.body.point,
        id_class: req.id_class,
        orders: maxOrder,
        showgrade: false
    }
    await assignments_db.add(new_assignment);
    
    new_assignments = await assignments_db.allInClass(req.id_class);
    let lastassignment = await assignments_db.findAssignmentByNameIDClass(req.id_class, req.body.name);
    //console.log("Add new assigment: ", lastassignment);
    let allUserInClass = await class_user_db.allStudentInClass(req.id_class);
    //console.log("All user Add new assigment: ", allUserInClass);
    for(i = 0; i<allUserInClass.length; i++){
        let newUser_Assignment = {
            id_user_uni: allUserInClass[i].id_uni_user,
            id_assignment: lastassignment.id,
            id_class: req.id_class,
            grade: null
        }
        await user_assignment_db.addAssigmentGrade(newUser_Assignment);
    }
    return res.status(200).json(new_assignments);
});

router.get('/detail/:id', async function(req, res) {
    //show detail of a assignment
    //name, point
    const id_assignment = req.params.id;
    const item = await assignments_db.one(id_assignment);
    res.status(200).json(item)
});

router.delete('/detail/:id', authMiddleWare.isTeacherinClass, authMiddleWare.isAssignmentinClass, async function(req, res){
    
    await assignments_db.del(req.params.id);
    return res.status(200).json(true);
});
router.post('/updateorder', authMiddleWare.isTeacherinClass, async function(req, res){
    
    const source = req.body.source;
    const des = req.body.destination;
    let minSourceDes = 0;
    let maxSourceDes = 0;
    const listitem = await assignments_db.allInClass(req.body.idclass);
    //console.log(listitem);
    let mul = 1;
    if (source < des) {
        mul = -1;
        minSourceDes = source;
        maxSourceDes = des;
    }
    else{
        minSourceDes = des;
        maxSourceDes = source;
    }
    for(i = 0; i<listitem.length; i++){
        if(listitem[i].orders == source){
            await updateOrderByIdAssignment(listitem[i].id, des);
        }
        else
        if(listitem[i].orders >= minSourceDes && listitem[i].orders <= maxSourceDes){
            await updateOrderByIdAssignment(listitem[i].id, listitem[i].orders + mul);
        }
    }
    const listitem2 = await assignments_db.allInClass(req.body.idclass);
    //console.log(listitem2);
    return res.status(200).json(listitem2);
});
router.post('/edit', authMiddleWare.isTeacherinClass, async function(req, res){
    const edititem = await assignments_db.editAssignment(req.body.idassignment, req.body.name, req.body.point);
    
    const listitem2 = await assignments_db.allInClass(req.body.idclass);
    await listitem2.sort((firstItem, secondItem) => firstItem.orders - secondItem.orders);
    
    return res.status(200).json(listitem2);
});

router.post('/updateshowstate', authMiddleWare.isTeacherinClass, async function(req, res){
    await assignments_db.updateShowGradeByIDAssignment(req.body.id_assignment, req.body.statechange);
    const id_class = req.body.id_class;
    let listShow = [];
    let assignmentShow = await assignments_db.assignmentShowGrade(id_class, true);
    if (assignmentShow == null){
        res.json([]);
    }
    for(let i = 0; i<assignmentShow.length; i++){
        listShow.push(assignmentShow[i].id)
    }
    res.json(listShow);
});

router.post('/addgradeassignment', authMiddleWare.isTeacherinClass, async function(req, res){
    // DESCRIPTION: Add assignment (with grade list from excel) to class

    let new_user_grade = req.body.new_user_grade;
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    for (let i = 0; i < new_user_grade.length; i++){
        let flag = await user_assignment_db.find1ScoreByIDAssignmentUser(id_assignment, new_user_grade[i].id_user_uni);
        if(flag == null){
            new_user_grade[i].id_class = id_class;
            new_user_grade[i].id_assignment = id_assignment;
            await user_assignment_db.addAssigmentGrade(new_user_grade[i]);
        }
        else{
            await user_assignment_db.updateAssigmentGrade(id_assignment, new_user_grade[i].id_user_uni, new_user_grade[i].grade);
        }
        
    }
    const updated_user_grade = await user_assignment_db.findAllScoreByIDAssignment(id_assignment);
    res.json(updated_user_grade);
});
router.post('/getgradeboard', authMiddleWare.isAuthen, async function(req, res){
    const id_class = req.body.id_class;
    //TODO: Check is teacher in class
    let isTeacher = await class_user_db.isTeacherinClass(id_class, req.jwtDecoded.data.id_uni);
    let structure = [];
    if(isTeacher){
        structure = await user_assignment_db.findAllScoreByClassID(id_class);
    }
    else{
        //TODO: lấy danh sách bài tập có trong lớp
        let listassignment = await assignments_db.allInClass(id_class);
        //TODO: Duyệt từng bài tập và kiếm điểm của sinh viên, nếu showgrade = false thì gán grade = "Chưa có điểm"
        for(i = 0; i<listassignment.length; i++){
            
            let temp = {};
            temp.nameAssignment  = listassignment[i].name;
            temp.idAssignment  = listassignment[i].id;
            if(listassignment[i].showgrade){
                let stuGradeAssi = await user_assignment_db.find1ScoreByIDAssignmentUser(listassignment[i].id, req.jwtDecoded.data.id_uni);
                
                let review = await review_db.getStatus(listassignment[i].id, req.jwtDecoded.data.id_uni);
                if(review == null){
                    temp.contentReview = 'Phúc khảo';
                    temp.enableReview = true;
                }
                else{
                    if(review.status == -1){
                        temp.contentReview = 'Đang xử lý';
                        temp.enableReview = true;
                    }
                    else{
                        temp.contentReview = 'Đã xử lý';
                        temp.enableReview = true;
                    }
                }
                if(stuGradeAssi == null){
                    temp.gradeAssignment = null;
                }
                else{
                    temp.gradeAssignment = stuGradeAssi.grade;
                }
            }
            else{
                temp.gradeAssignment = "Chưa có điểm";
                temp.contentReview = 'Phúc khảo';
                temp.enableReview = false;
            }
            structure.push(temp);
        }
    }
    console.log("Structure: ", structure);
    res.json(structure);
});

router.post('/getlistshowgrade', authMiddleWare.isAuthen, async function(req, res){
    const id_class = req.body.id_class;
    let listShow = [];
    let assignmentShow = await assignments_db.assignmentShowGrade(id_class, true);
    if (assignmentShow == null){
        return res.json([]);
    }
    for(let i = 0; i<assignmentShow.length; i++){
        listShow.push(assignmentShow[i].id)
    }
    res.json(listShow);
});

router.post('/getlistcomment', async function(req, res){
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    const id_uni = req.jwtDecoded.data.id_uni;
    let review = await review_db.findReviewByUserAssignment(id_uni, id_assignment);
    if (review == null){
        return res.json([]);
    }
    let listComment = await comment_db.commentsByReviewID(review.review.id);
    res.json(listComment);
});
router.post('/teacherlistcomment', async function(req, res){
    const id_review = req.body.id_review;
    let listComment = await comment_db.commentsByReviewID(id_review);
    if(listComment.length>0){
        return res.json(listComment);
    }
    res.json([]);
});
router.post('/getdetailreview', async function(req, res){
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    const id_uni = req.jwtDecoded.data.id_uni;
    let review = await review_db.findReviewByUserAssignment(id_uni, id_assignment);
    if (review == null){
        return res.json([]);
    }
    res.json(review);
});

router.post('/teachernews', async function(req, res){
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    const id_uni = req.jwtDecoded.data.id_uni;
    let review = await review_db.findReviewByIDClass(id_class);
    if (review == null){
        return res.json([]);
    }
    await review.sort((firstItem, secondItem) => secondItem.id_review - firstItem.id_review);
    res.json(review);
});

router.post('/getgradeafter', async function(req, res){
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    const id_uni = req.jwtDecoded.data.id_uni;
    let grade = await review_db.findReviewGradeByUserAssignment(id_uni, id_assignment);
    if (grade == null){
        return res.json(null);
    }
    res.json(grade);
});

router.post('/teachergradeafter', async function(req, res){
    const id_review = req.body.id_review;
    let grade = await review_db.findGradeAfterTeacherByIdReview(id_review);
    if (grade == null){
        return res.json(null);
    }
    res.json(grade);
});

router.post('/addreview', async function(req, res){
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    const id_uni = req.jwtDecoded.data.id_uni;
    const addReview = {
        id_user_uni: id_uni,
        id_assignment: id_assignment,
        id_class: id_class,
        current_grade: req.body.current,
        expect_grade: req.body.expect,
        explain: req.body.explain,
        create_time: moment().add(7, 'hours'),
        status: -1
    }
    await review_db.add(addReview);
    console.log("Add review: ", addReview);
    let review = await review_db.findReviewByUserAssignment(id_uni, id_assignment);
    if (review == null){
        return res.json([]);
    }
    await review.sort((firstItem, secondItem) => secondItem.review.id - firstItem.review.id);
    res.json(review);
});

router.post('/teachersubmitgrade', async function(req, res){
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    const id_uni = req.body.student_id;
    const new_grade = req.body.teacher_grade;
    const id_review = req.body.id_review;
    
    await user_assignment_db.updateAssigmentGrade(id_assignment, id_uni, new_grade);
    let review = await review_db.updateStatus(id_review, 1);
    if (review == null){
        return res.json([]);
    }
    res.json(new_grade);
});

router.post('/submitcomment', async function(req, res){
    const id_class = req.body.id_class;
    const id_review = req.body.id_review;
    const id_uni = req.jwtDecoded.data.id_uni;
    const addComment = {
        id_user_uni: id_uni,
        id_review: id_review,
        content: req.body.contentComment,
        create_time: moment().add(7, 'hours')
    }
    await comment_db.add(addComment);
    let commentList = await comment_db.commentsByReviewID(id_review);
    console.log(`List comment by review id:`, commentList);
    if (commentList == null){
        return res.json([]);
    }
    res.json(commentList);
});

router.post('/updategradestudent', authMiddleWare.isAuthen, async function(req, res){
    const id_class = req.body.id_class;
    const idUser = req.body.id_uni_user;
    const listUpdate = req.body.update_user_grade;
    for(i = 0; i < listUpdate.length; i++){
        let grade = listUpdate[i].gradeAssignment
        if(grade == ''){
            grade = null;
        }
        if(typeof(grade)=='string'){
            grade = Number(listUpdate[i].gradeAssignment);
        }
        await user_assignment_db.updateAssigmentGrade(listUpdate[i].idAssignment, idUser, grade);
    }
    res.json(true);
});

module.exports = router;