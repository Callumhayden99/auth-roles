const { PrismaClientKnownRequestError } = require('@prisma/client')

// DB
const { getAllUsersDb, createUserDb, deleteUserDb } = require('../domains/user.js')

// Error Handlers
const { checkAdminUser } = require('../middleware/middle.js')

// Helpers
const { verifyUser } = require('../utils/help.js')

const getUser = async (req, res) => {
  const { authorization } = req.headers;

  try {
    const verifiedUser = await verifyUser(authorization);

    checkAdminUser(verifiedUser.role); // This will throw an error with status 403 if not admin

    const usersList = await getAllUsersDb();
    res.status(200).json({ users: usersList });
  } catch (error) {
   
    res.status(error.status || 500).json({ error: error.message });
  }
};


const createUser = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      error: 'Missing fields in request body'
    })
  }

  try {
    const createdUser = await createUserDb(username, password)

    return res.status(201).json({ user: createdUser })
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return res
          .status(409)
          .json({ error: 'A user with the provided username already exists' })
      }
    }

    res.status(500).json({ error: e.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    
    const { userId } = req.params;
    const user = await deleteUserDb(userId);
    res.status(200).json({ message: 'User deleted successfully', user });
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(404).send('User not found.');
    } else {
      console.error('Error deleting user:', error);
      res.status(500).send('Internal Server Error');
    }
  }
};



module.exports = {
  getUser,
  createUser,
  deleteUser
}