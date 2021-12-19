const express = require('express');
const router = express.Router();
const authMiddleWare = require('../../../../middlewares/auth_middleware.mdw');
const { updateOrderByIdAssignment } = require('../../../../models/assignments');
const assignments_db = require('../../../../models/assignments')
const user_assignment_db = require('../../../../models/user_assignments');
const class_user_db = require('../../../../models/class_user');
//url: /detail/:id/assigments

router.get('/', async function(req, res, next) {
    //show list assignments
    //name, point
    const id_class = req.id_class;
    const items = await assignments_db.allInClass(id_class);
    await items.sort((firstItem, secondItem) => firstItem.orders - secondItem.orders);
    res.status(200).json(items)
});
//Tạo assignment mới sẽ mặc định điểm các sinh viên trong lớp là null (add ở bảng user_assignment)
router.post("/", authMiddleWare.isTeacherinClass, async function(req, res){
    console.log(req.body)
    console.log(req.id_class);
    
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
    console.log("Add new assigment: ", lastassignment);
    let allUserInClass = await class_user_db.allStudentInClass(req.id_class);
    console.log("All user Add new assigment: ", allUserInClass);
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
    console.log("req.params.id:",req.params.id);
    await assignments_db.del(req.params.id);
    return res.status(200).json(true);
});
router.post('/updateorder', authMiddleWare.isTeacherinClass, async function(req, res){
    console.log("req.body.idclass:",req.body.idclass);
    console.log("Source and Destination: ", req.body.source,"; ", req.body.destination);
    const source = req.body.source;
    const des = req.body.destination;
    let minSourceDes = 0;
    let maxSourceDes = 0;
    const listitem = await assignments_db.allInClass(req.body.idclass);
    console.log(listitem);
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
    console.log(listitem2);
    return res.status(200).json(listitem2);
});
router.post('/edit', authMiddleWare.isTeacherinClass, async function(req, res){
    console.log("req.body edit:",req.body);
    const edititem = await assignments_db.editAssignment(req.body.idassignment, req.body.name, req.body.point);
    
    const listitem2 = await assignments_db.allInClass(req.body.idclass);
    await listitem2.sort((firstItem, secondItem) => firstItem.orders - secondItem.orders);
    console.log(listitem2);
    return res.status(200).json(listitem2);
});
router.post('/addgradeassignment', authMiddleWare.isTeacherinClass, async function(req, res){
    // DESCRIPTION: Add assignment (with grade list from excel) to class

    let new_user_grade = req.body.new_user_grade;
    const id_class = req.body.id_class;
    const id_assignment = req.body.id_assignment;
    console.log(req.body);
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
router.post('/getgradeboard', authMiddleWare.isTeacherinClass, async function(req, res){
    const id_class = req.body.id_class;
    console.log(req.body);
    let structure = [];
    structure = await user_assignment_db.findAllScoreByClassID(id_class);
    res.json(structure);
});

module.exports = router;