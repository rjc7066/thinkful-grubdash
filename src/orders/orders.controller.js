const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// middleware helpers
function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
}
function textPropertiesAreValid(req, res, next) {
    const { data: { deliverTo, mobileNumber } = {}} = req.body;
    if (deliverTo === "") {
        next({ status: 400, message: `Order must include a deliverTo`});
    }
    if (mobileNumber === "") {
        next({ status: 400, message: `Order must include a mobileNumber`});
    }
    return next();
}
function dishesAreValid(req, res, next) {
    const { data: { dishes } = {}} = req.body;
    if (!Array.isArray(dishes) || dishes.length <= 0) {
        next({ status: 400, message: `Order must include at least on dish`});
    }
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        if (dish.quantity <= 0 || typeof dish.quantity !== "number") {
            next({ status: 400, message: `Dish ${i} must have a quantity that is an integer greater than 0`});
        }
    }
    return next();
}
function statusIsValid(req, res, next) {
    const { data: { status } = {}} = req.body;
    const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"]
    if (!validStatuses.includes(status)) {
        next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered`});
    }
    if (status === 'delivered') {
        next({ status: 400, message: "A delivered order cannot be changed"});
    }
    return next();
}
function statusIsValidForDelete(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder.status != 'pending') {
        next({ status: 400, message: "An order cannot be deleted unless it is pending."});
    }
    return next();
}
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`
    });
}


// create
function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {}} = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status: "pending",
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder});
}

// read
function read(req, res) {
    res.json({ data: res.locals.order});
}

// update
function update(req, res, next) {
    const order = res.locals.order;
    const { data: { id, deliverTo, mobileNumber, dishes } = {}} = req.body;
    const { orderId } = req.params;

    if (id && id !== orderId) {
        next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`});
    } else {
        order.deliverTo = deliverTo;
        order.mobileNumber = mobileNumber;
        order.dishes = dishes;
    
        res.json({ data: order});
    }
}

// delete
function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

// list
function list(req, res) {
    res.send({ data: orders});
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        textPropertiesAreValid,
        dishesAreValid,
        create,
    ],
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        textPropertiesAreValid,
        dishesAreValid,
        statusIsValid,
        update,
    ],
    delete: [
        orderExists,
        statusIsValidForDelete,
        destroy,
    ],
    list,
}