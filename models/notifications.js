const db = require('../utils/connectDB');
const classess_db = require('../models/classes.js');
const moment = require('moment');

module.exports = {
    async allInUser(id_user_uni){
        const items = await db('notifications').where('id_user_uni', id_user_uni);
        for (let i = 0; i < items.length; i++){
            const _class = await classess_db.one(items[i].id_class, id_user_uni)
            items[i].class_name = _class.class_name;
            items[i].create_time = moment(items[i].create_time).format("DD/MM/YYYY HH:mm:ss");
        }
        if (items.length===0)
            return items;
        return items.reverse();
    },

    async one(id){
        const items = await db('notifications').where('id', id);
        if (items.length===0) 
            return null;
        let item = items[0];
        item.class = classess_db.one(item.id_class, item.id_user_uni);
        item.create_time = moment(item.create_time).format("DD/MM/YYYY HH:mm:ss");
        return item;
    },

    async oneByUniIDandCreateTime(id_user_uni, create_time){
        const items = await db('notifications').where({
            id_user_uni: id_user_uni,
            create_time: create_time,
        });
        if (items.length===0) 
            return null;
        let item = items[0];
        item.class = classess_db.one(item.id_class, item.id_user_uni);
        item.create_time = moment(item.create_time).format("DD/MM/YYYY HH:mm:ss");
        return item;
    },

    updateStatus(id, new_status){
        return db('notifications').where('id', id).update('status', new_status);
    },

    markAsRead(){
        return db('notifications').update('status', 1);
    },

    add(new_noti){
        return db('notifications').insert(new_noti);
    },
}
