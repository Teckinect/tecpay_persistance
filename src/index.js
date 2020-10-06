const { ServiceBroker } = require("moleculer");
const mongoose = require('mongoose');

const dbConfig = { host: '127.0.0.1', port: 27017 };
if (process.env.DB_HOST) dbConfig.host = process.env.DB_HOST
if (process.env.DB_PORT) dbConfig.port = process.env.DB_PORT


let broker_schema = {
    name: "persistence",
    async created() {
        console.log('--------------------------------------------------Persistence Created');
        let url = process.env.MONGO_URL;
        console.log(url)
        await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected');
    },
    actions: {
        async registerModel(ctx) {
            try {
                var schema = new mongoose.Schema({}, { strict: false });
                if (ctx.params.schema) {
                    let fn = function(e,idx){
                        if (e.type == 'id') e.type = mongoose.Schema.Types.ObjectId;
                        return e;
                    }
                    for (let i in ctx.params.schema) {
                        if(Array.isArray(ctx.params.schema[i])){
                            ctx.params.schema[i] =ctx.params.schema[i].map(fn);
                        }else{
                            ctx.params.schema[i] = fn(ctx.params.schema[i]);
                        }   
                    }
                    schema = new mongoose.Schema(ctx.params.schema, { strict: false });
                    if (ctx.params.virtual) {
                        schema.virtual(ctx.params.virtual.name, ctx.params.virtual.obj);
                        schema.set('toObject', { virtuals: true });
                        schema.set('toJSON', { virtuals: true });
                    }
                }

                mongoose.model(ctx.params.model, schema);
            } catch (e) {
                console.log(e)
                // console.log(e);
            }
        },
        async find(ctx) {
            let model = mongoose.model(ctx.params.model);
            // let obj = await model.find(ctx.params.query);
            let exec = model.find(ctx.params.query);
            if (ctx.params.populate) exec.populate(ctx.params.populate);
            if (ctx.params.sort) exec.sort(ctx.params.sort);
            if (ctx.params.limit) exec.limit(ctx.params.limit);
            if (ctx.params.select) exec.select(ctx.params.select);
            exec.lean();
            let obj = await exec;
            return obj;
        },
        async findOne(ctx) {
            let model = mongoose.model(ctx.params.model);
            let exec = model.findOne(ctx.params.query);
            if (ctx.params.populate) exec.populate(ctx.params.populate);
            if (ctx.params.sort) exec.sort(ctx.params.sort);
            if (ctx.params.limit) exec.limit(ctx.params.limit);
            if (ctx.params.select) exec.select(ctx.params.select);
            // if (ctx.params.lean) exec.lean();
            exec.lean();
            let obj = await exec;
            return obj;
        },
        async save(ctx) {
            let Model = mongoose.model(ctx.params.model);
            let data = JSON.parse(JSON.stringify(ctx.params.data));
            if (data._id) {
                let id = data._id;
                delete data['_id'];
                Model.update({ _id: id }, { $set: data }, function (err, small) {
                    if (err) console.log(err)
                    // saved!
                });
            } else {
                Model.create(data, function (err, small) {
                    if (err) console.log(err)
                    // saved!
                });
            }
        },
        async findOneAndUpdate(ctx) {
            let model = mongoose.model(ctx.params.model);
            let el = ctx.params.data;
            let query = ctx.params.query;
            let obj = await model.findOneAndUpdate(query, el, { new: true, upsert: true });
            return obj;
        },
        async update(ctx) {
            let model = mongoose.model(ctx.params.model);
            let el = ctx.params.data;
            let query = ctx.params.query;
            let obj = await model.update(query, el, { upsert: true, multi: true });
            return obj;
        },
        async updateOne(ctx) {
            let model = mongoose.model(ctx.params.model);
            let el = ctx.params.data;
            let query = ctx.params.query;
            let opts = ctx.params.opts||{};
            let obj = await model.updateOne(query, el, opts);
            return obj;
        },
        async delete(ctx) {
            let model = mongoose.model(ctx.params.model);
            let query = ctx.params.query;
            // let obj = await model.deleteOne(query,el);
            let obj = await model.deleteOne(query);
            return obj
        },
        async bulk(ctx) {
            let model = mongoose.model(ctx.params.model);
            let obj = await model.bulkWrite(ctx.params.bulk);
            return obj;
        },
    }
}
const broker = new ServiceBroker({
    namespace: 'tecpay',
    nodeID: "persistence",
    logger: true,
    transporter: "TCP",
    hotReload: true
});

broker.createService(broker_schema);
broker.start();