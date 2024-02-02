const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// middleware helpers
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}
function textPropertiesAreValid(req, res, next) {
    const { data: { name, description, image_url } = {}} = req.body;
    if (name === "") {
        next({ status: 400, message: `Dish must include a name`});
    }
    if (description === "") {
        next({ status: 400, message: `Dish must include a description`});
    }
    if (image_url === "") {
        next({ status: 400, message: `Dish must include a image_url`});
    }
    return next();
}
function pricePropertyIsValid(req, res, next) {
    const { data: { price } = {}} = req.body;
    if (price <= 0 || typeof price != "number") {
        next({ status: 400, message: `Dish must have a price that is an integer greater than 0`});
    }
    return next();
}
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`
    });
}

// list all
function list(req, res) {
  res.json({ data: dishes });
}

// create
function create(req, res) {
  // extract new dish data from request body
  const { data: { name, description, price, image_url } = {} } = req.body;

  // create new dish and add it to dishes array
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);

  // return new dish
  res.status(201).json({ data: newDish });
}

// read
function read(req, res) {
    res.json({ data: res.locals.dish});
}

// update
function update(req, res, next) {
    const dish = res.locals.dish;
    const {data: { id, name, description, price, image_url } = {}} = req.body;
    const {dishId} = req.params;

    if (id && id !== dishId) {
        next({ status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
    } else {
        dish.name = name;
        dish.description = description;
        dish.price = price;
        dish.image_url = image_url;
    
        res.json({ data: dish});
    }
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    textPropertiesAreValid,
    pricePropertyIsValid,
    create,
  ],
  read: [
    dishExists,
    read,
  ],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    textPropertiesAreValid,
    pricePropertyIsValid,
    update,
  ],
};
