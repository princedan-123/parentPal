import db from '../utils/db.js';
import sha1 from 'sha1';

const appController = {
  async login(req, res) {
    const {email, password} = req.body;
    if (!email) {
      return res.status(404).json({ error: 'missing email'});
    }
    if (!password) {
      return res.status(404).json({ error: 'missing password'});
    }
    console.log(email, password);
    await db.init();
    try {
      const hashedPassword = sha1(password);
      const user =  await db.tutorCollection.findOne({email});
      console.dir(user);
      if (user && user.password === hashedPassword) {
        const {
          firstName, lastName, userName, qualifications, country, state,
          city, area, street, subjects, available, email
        } = user;
        const userData = {
          firstName, lastName, userName, qualifications, country, state,
          city, area, street, subjects, available, email
        }
        console.log(`userData: ${userData}`)
        req.session.user = userData;
        return res.status(200).json({ status: 'logged in' })
      }
      if (!user)
      {
        return res.status(404).json({ error: 'incorrect email'});
      }
      if(user.password !== hashedPassword) {
        return res.status(404).json({ error: 'incorrect password'});
      }
      } catch (error) {
      res.status(500).json({ error: `an error occurred during authentication: ${error}`})
    } finally{
      await db.close();
    }
  }
}
export default appController;
