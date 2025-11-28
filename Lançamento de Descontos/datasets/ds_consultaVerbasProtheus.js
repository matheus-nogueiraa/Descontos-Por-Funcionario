function createDataset(fields, constraints, sortFields) {
    var newDataset = DatasetBuilder.newDataset();
    var jdbcName = fluigAPI.getTenantService().getTenantData(["envJdbcName"]).get("envJdbcName").trim();
    var dataSource = "java:/jdbc/" + jdbcName;
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    var myQuery = "";
    var filial = "";
    var codVerba = "";

    if (constraints.length > 0) {
        for (var c = 0; c < constraints.length; c++) {
            if (constraints[c].fieldName == "filial") {
                filial = ("" + constraints[c].initialValue + "").trim();
            }
            if (constraints[c].fieldName == "codVerba") {
                codVerba = ("" + constraints[c].initialValue + "").trim();
            }
        }
    }

    myQuery += " SELECT "
    myQuery += "     * "
    myQuery += " FROM SRV010 SRV "
    myQuery += " WHERE SRV.D_E_L_E_T_ = ' ' "

    if (filial){
        myQuery += " AND SRV.RV_FILIAL = LEFT('" + filial + "', 2) "
    }
    
    if (codVerba){
        myQuery += " AND SRV.RV_COD = '" + codVerba + "' "
    }
    
    myQuery += " ORDER BY SRV.RV_COD "   

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(myQuery);
        var columnCount = rs.getMetaData().getColumnCount();
        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }

            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var obj = rs.getObject(rs.getMetaData().getColumnName(i));
                if (null != obj) {
                    Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString();
                } else {
                    Arr[i - 1] = "null";
                }
            }
            newDataset.addRow(Arr);
        }
    } catch (e) {
        newDataset.addColumn('ERRO');
        newDataset.addRow([e.message]);

        log.error("ERRO==============> " + e.message);

    } finally {
        if (rs != null) {
            rs.close();
        }
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
    return newDataset;
}