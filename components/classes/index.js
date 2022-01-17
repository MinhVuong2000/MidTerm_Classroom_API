const { DOMAIN_FE } = require('../../config/const.config')
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const AuthMiddleWare = require('../../middlewares/auth_middleware.mdw')
const classed_db = require('../../models/classes');
const class_user_db = require('../../models/class_user');
const assignments_db = require('../../models/assignments');
const user_assignment_db = require('../../models/user_assignments');
const detail_class = require('./detail_class')
const BASEURL = DOMAIN_FE + 'classes/inviteclass/'

function randomString(n) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < n; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

/* GET home page. */
router.get('/', async function(req, res, next) {
    console.log(req.jwtDecoded.data);
    if(req.jwtDecoded.data.id_uni === undefined){
        console.log("Khong co id_uni");
        return res.json(null)
    }
    if (req.jwtDecoded.data.id_uni === '')
        return res.json(null);
    if (req.jwtDecoded.data.id_uni === null)
        return res.json(null);
    const allData = await classed_db.all(req.jwtDecoded.data.id_uni);
    res.json(allData);
});

router.post('/', async function(req, res, next){
    //const randomstr = randomstring(8);
    //link = link + randomstr;
    console.log(req.jwtDecoded);
    if(req.jwtDecoded){
        let enlink = encodeURI(req.body.class_name);
        console.log("vao add class");
        console.log("encode", enlink);
        let codeclass = randomString(6);
        while(await classed_db.checkCodeClassExist(codeclass)){
            codecart = await randomString(6);
        }
        const new_class = {
            class_name: req.body.class_name,
            description: req.body.description,
            id_admin: req.jwtDecoded.data.id,
            invitation_link: enlink,
            code: codeclass
        };
        
        console.log("new class", new_class);
        await classed_db.add(new_class, req.jwtDecoded.data.id_uni, req.jwtDecoded.data.full_name);
        const allclassed_db = await classed_db.all(req.jwtDecoded.data.id_uni);
        res.json(allclassed_db);
    }
    else{
        res.json(false);
    }
    
}),

router.use('/detail/:id', AuthMiddleWare.isAuthen, detail_class)

router.get('/inviteclass/:link', async function(req, res, next) {
    if(req.jwtDecoded){
        const linkclass = await encodeURI(req.params.link);
        console.log("link class",linkclass);

        //Xử lý trường hợp mời học sinh == linkclass là code
        const codeitem = await classed_db.findClassByCode(linkclass);
        if(codeitem==false){
            //Nếu ko phải mời học sinh ==> mời giáo viên
            const itemid = await classed_db.findIDClassByLink(linkclass);
            if(itemid == null){
                return res.json(null);
            }
            let flaglink = await class_user_db.checkIsExistUserOnClass(itemid, req.jwtDecoded.data.id_uni)
            if(!flaglink){
                await class_user_db.addTeacherToClass(itemid, req.jwtDecoded.data.id_uni, req.jwtDecoded.data.full_name);
            }
            const itemslink = await classed_db.one(itemid, req.jwtDecoded.data.id_uni);
            return res.json(itemslink);
        }
        let flag = await class_user_db.checkIsExistUserOnClass(codeitem, req.jwtDecoded.data.id_uni)
        if(!flag){
            await class_user_db.addUserToClass(codeitem, req.jwtDecoded.data.id_uni, req.jwtDecoded.data.full_name);
            //TODO: When new user add to class, thêm điểm trong User_Assignment là null
            let listAssignment = await assignments_db.allInClass(codeitem);
            for(i = 0; i< listAssignment.length; i++){
                let tempUserAssignment = {
                    id_user_uni: req.jwtDecoded.data.id_uni,
                    id_assignment: listAssignment[i].id,
                    id_class: codeitem,
                    grade: null
                };
                await user_assignment_db.addAssigmentGrade(tempUserAssignment);
            }
        }
        const items = await classed_db.one(codeitem, req.jwtDecoded.data.id_uni);
        return res.json(items);
    }
    else{
        return res.json(null);
    }
});

router.post('/sendinvite/:classlink', async function(req, res, next){
    //TODO: get email from form
    //let email = req.body.email;
    let email = req.body.email;
    console.log(email);
    let classlink = encodeURI(req.params.classlink);
    const itemcode = await classed_db.findCodeClassByLink(classlink);
    classlink = BASEURL + itemcode;
    console.log("send invite student: ", classlink);
    let transporter = nodemailer.createTransport(
        {
            service: 'gmail',
            auth: {
              user: 'classroom.webnangcao@gmail.com',
              pass: 'thangtrinhvuong'
            },
    });
    
    var mailOptions={
        from: "classroom.webnangcao@gmail.com",
        to: email,
       subject: "Invite link to Classroom",
       html: `<p>Dear you,${email}</p>`+
       "<h3>This is an invitation link to classroom </h3>"  + 
       "<h1 style='font-weight:bold;'>" + classlink +"</h1>" +
       "<p>Thank you</p>",
    };
     
     transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Sent email error: ", error);
            return res.json(false);
        }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.json(true);
    });
    
}),

router.post('/sendinviteteacher/:classlink', async function(req, res, next){
    //TODO: get email from form
    //let email = req.body.email;
    let email = req.body.email;
    console.log(email);
    let classlink = encodeURI(req.params.classlink);
    classlink = BASEURL + classlink;
    console.log(classlink);
    let transporter = nodemailer.createTransport(
        {
            service: 'gmail',
            auth: {
              user: 'classroom.webnangcao@gmail.com',
              pass: 'thangtrinhvuong'
            },
    });
    
    var mailOptions={
        from: "classroom.webnangcao@gmail.com",
        to: email,
       subject: "Invite link to Classroom",
       html: `<p>Dear you,${email}</p>`+
       "<h3>This is an invitation link to classroom </h3>"  + 
       "<h1 style='font-weight:bold;'>" + classlink +"</h1>" +
       "<p>Thank you</p>",
    };
     
     transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Sent email error: ", error);
            return res.json(false);
        }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.json(true);
    });
    
}),

router.get('/isExistedClassName', async function(req, res, next){
    const checked_name = req.query.checked_name;
    const isExisted = await classed_db.isExisted(checked_name);
    console.log("isExistedName:",isExisted)
    res.json(isExisted);
});
router.get('/isExistedClassCode', async function(req, res, next){
    
    if(req.jwtDecoded){
        const checked_code = req.query.checked_code;
        const isExisted = await classed_db.findClassByCode(checked_code);

        let flag = await class_user_db.checkIsExistUserOnClass(isExisted, req.jwtDecoded.data.id_uni)
        if(!flag){
            await class_user_db.addUserToClass(isExisted, req.jwtDecoded.data.id_uni, req.jwtDecoded.data.full_name);
            //TODO: When new user add to class, thêm điểm trong User_Assignment là null
            let listAssignment = await assignments_db.allInClass(isExisted);
            for(i = 0; i< listAssignment.length; i++){
                let tempUserAssignment = {
                    id_user_uni: req.jwtDecoded.data.id_uni,
                    id_assignment: listAssignment[i].id,
                    id_class: isExisted,
                    grade: null
                };
                await user_assignment_db.addAssigmentGrade(tempUserAssignment);
            }
        }
        console.log("isExistedCode:",isExisted)
        res.json(isExisted);
    }
    else{
        res.json(null);
    }
});

module.exports = router;
