"use strict";
const sequelize = require('sequelize')

const fs = require("fs");
var CryptoJS = require("crypto-js");

class SequelizeIE {
    constructor(models = []) {
        this._models = [];
        for (let m in models) {
            if (models[m] && models[m].build) {
                let m_ = models[m].build();
                if (models[m].name && models[m].name.length) {
                    this._models[models[m].name] = models[m];
                }
            }

        }

        this.import = this.import.bind(this);
        this.export = this.export.bind(this);
    }

    import(dir, options = { overwrite: false }) {
        if (!dir)
            throw new Error("Please Specify a Directory to place the export file");
        return new Promise((resolve, reject) => {
            let dataModels = [];
            try {

                fs.readFile(dir, (err, data) => {
                    if (err) reject(err);
                    // parse the content
                    dataModels = JSON.parse(data.toString());
                    (async () => {
                        for (let m in this._models) {
                            let tmpModel = dataModels.find(mod => {
                                let bytesModel  = CryptoJS.AES.decrypt(mod.modelName, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWJCNGVFYUE3Ny02NWE0LTRlMjgtOGYzNS05YmQxOTA3ZmY3NGYiLCJuYW1lIjoiR2FydWRhIEthc2lyIiwiaWF0IjoxNTE2MjM5MDIyfQ.x7HEgt9v1Trz02ROCmedz8Yo9ixKTSjAmuEnN-BgvpI');
                                let models = bytesModel.toString(CryptoJS.enc.Utf8);
                                return models === m ? m :''
                            });
                            if (tmpModel) {
                                if (options.overwrite) {
                                    await this._models[m].destroy({ where: {}, truncate: { cascade: false } });
                                }

                                // insert the data
                                let bytes  = CryptoJS.AES.decrypt(tmpModel.data, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YkIyOTM5MTEtOTM5Y0MtNDY0OS04MDA2LTAwNDdiQjk3OWY5NGREIiwibmFtZSI6IkdhcnVkYSBLYXNpciIsImlhdCI6MTUxNjIzOTAyMn0.Z63gmy6LmzWMiuLX7TAFwy2ISLz0YCp44nbK6n7wq2s');
                                let decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                                decryptedData.map(async (row) => {
                                    try {
                                        await this._models[m].upsert(row)
                                    } catch (err) {
                                        reject(err);
                                    }
                                });
                            }
                        }
                        resolve();
                    })();
                });
            } catch (err) {
                console.log({err})
            }
        });
    }

    export(dir) {
        if (!dir)
            throw new Error("Please Specify a Directory to place the export file");

        return new Promise((resolve, reject) => {
            try {
                (async () => {
                    let exportData = [];
                    for (let m in this._models) {
                        let tmpData = await this._models[m].findAll({ paranoid: false });
                        if (tmpData) {
                            tmpData = CryptoJS.AES.encrypt(JSON.stringify(tmpData), 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YkIyOTM5MTEtOTM5Y0MtNDY0OS04MDA2LTAwNDdiQjk3OWY5NGREIiwibmFtZSI6IkdhcnVkYSBLYXNpciIsImlhdCI6MTUxNjIzOTAyMn0.Z63gmy6LmzWMiuLX7TAFwy2ISLz0YCp44nbK6n7wq2s').toString();
                        }
                        let tmpobj = {
                            modelName: CryptoJS.AES.encrypt(m, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWJCNGVFYUE3Ny02NWE0LTRlMjgtOGYzNS05YmQxOTA3ZmY3NGYiLCJuYW1lIjoiR2FydWRhIEthc2lyIiwiaWF0IjoxNTE2MjM5MDIyfQ.x7HEgt9v1Trz02ROCmedz8Yo9ixKTSjAmuEnN-BgvpI').toString(),
                            data: tmpData || []
                        }

                        exportData.push(tmpobj);
                    }

                    // place the file in the dir
                    fs.writeFile(dir, JSON.stringify(exportData), (err) => {
                        if (err) reject(err)
                        else
                            resolve(dir);
                    })
                })();
            } catch (err) {
                reject(err);
            }
        });
    }

}

module.exports = SequelizeIE;
