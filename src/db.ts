import Table from "./table";

interface DatabaseOptions {
  
}

export default class Database {

  constructor(dbOptions: DatabaseOptions) {
    
  }

  public async createTable(tableName: string): Promise<Table> {
    return new Table(tableName);
  }
}