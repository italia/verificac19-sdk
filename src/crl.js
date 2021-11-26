const mongoose = require('mongoose');

class CRL {
  async setUp() {
    this._dbConnection = await mongoose.createConnection(
      process.env.VC19_MONGODB_URL || 'mongodb://root:example@localhost:27017/VC19?authSource=admin',
    );
    this._dbModel = this._dbConnection.model('UVCI', new mongoose.Schema({
      _id: String,
    }));
  }

  async storeRevokedUVCI(revokedUvci) {
    const session = await this._dbModel.startSession();
    await session.withTransaction(() => {
      const revokedUvciForDb = revokedUvci.map((uvci) => ({ _id: uvci }));
      return this._dbModel.insertMany(revokedUvciForDb, {session});
    });
    session.endSession();
  }

  async isUVCIRevoked(uvci) {
    return !!await this._dbModel.findOne({ _id: uvci });
  }

  async tearDown() {
    if (this._dbConnection) {
      await this._dbConnection.close();
    }
    await mongoose.disconnect();
  }

  async clean() {
    await this._dbModel.deleteMany();
  }
}

const crlSingleton = new CRL();

module.exports = crlSingleton;
