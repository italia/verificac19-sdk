const mongoose = require('mongoose');

const MODEL_NAME = 'UVCI';

class CRL {
  async setUp() {
    this._dbConnection = await mongoose.createConnection(
      process.env.VC19_MONGODB_URL || 'mongodb://root:example@localhost:27017/VC19?authSource=admin',
    );
    this._dbModel = this._dbConnection.model(MODEL_NAME, new mongoose.Schema({
      _id: String,
    }));
  }

  async storeRevokedUVCI(revokedUvci = [], deletedRevokedUvci = []) {
    if (revokedUvci.length > 0) {
      try {
        await this._dbModel.insertMany(revokedUvci.map((uvci) => ({ _id: uvci })));
      } catch {
        for (const uvciToInsert of revokedUvci) {
          try {
            await new this._dbModel({ _id: uvciToInsert }).save();
          } catch {
            // Insertion error (duplicate)
          }
        }
      }
    }
    if (deletedRevokedUvci.length > 0) {
      for (const uvciToRemove of deletedRevokedUvci) {
        await this._dbModel.deleteOne({ _id: uvciToRemove });
      }
    }
  }

  async isUVCIRevoked(uvci) {
    return !!await this._dbModel.findOne({ _id: uvci });
  }

  async tearDown() {
    if (this._dbConnection) {
      await this._dbConnection.close();
      delete this._dbConnection.models[MODEL_NAME];
      delete this._dbConnection.collections.uvcis;
      await this._dbConnection.deleteModel(/.+/);
      await mongoose.deleteModel(/.+/);
    }
  }

  async clean() {
    await this._dbModel.deleteMany();
  }
}

const crlSingleton = new CRL();

module.exports = crlSingleton;
