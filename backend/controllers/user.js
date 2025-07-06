const User = require("../models/user");

const getAuthUser = async (req, res) => {
	if (!req.user) {
		return res.status(404).json({ message: `User Not Found` });
	}
	res.status(200).json({
		data: req.user,
	});
};

const getAllUsers = async (req, res) => {
	try {
		const allUsers = await User.find()
			.select("-password")
			.sort({ _id: -1 }); // Sort by creation time (newest first)

		res.status(200).send({ data: allUsers });
	} catch (err) {
		console.error("Error fetching users:", err);
		res.status(500).send({ message: "Internal Server Error" });
	}
};


module.exports = { getAuthUser, getAllUsers };
