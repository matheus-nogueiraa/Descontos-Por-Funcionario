function createDataset(fields, constraints, sortFields) {
    var newDataset = DatasetBuilder.newDataset();
    var jdbcName = fluigAPI.getTenantService().getTenantData(["envJdbcName"]).get("envJdbcName").trim();
    var dataSource = "java:/jdbc/" + jdbcName;
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    var myQuery = "";
    var filial = "";
    var matricula = "";
    var periodoAtual = "";

    if (constraints.length > 0) {
        for (var c = 0; c < constraints.length; c++) {
            if (constraints[c].fieldName == "filial") {
                filial = ("" + constraints[c].initialValue + "").trim();
            }
            if (constraints[c].fieldName == "matricula") {
                matricula = ("" + constraints[c].initialValue + "").trim();
            }
            if (constraints[c].fieldName == "periodoAtual") {
                periodoAtual = ("" + constraints[c].initialValue + "").trim();
            }
        }
    }

    if (!filial || !matricula || !periodoAtual) {
        newDataset.addColumn('ERRO');
        newDataset.addRow(['Filial, Matrícula ou Período Inválidos']);
        return newDataset;
    }

    myQuery += " SELECT "
    myQuery += "     SRK.RK_FILIAL codFilial, "
    myQuery += "     SRK.RK_PROCES codProcesso, "
    myQuery += "     SRK.RK_MAT matricula, "
    myQuery += "     SRK.RK_PD codVerba, "
    myQuery += "     SRV.RV_DESC descVerba, "
    myQuery += "     SRK.RK_MESDISS mesDissidio, "
    myQuery += "     SRK.RK_VALORTO valor "
    myQuery += " FROM SRK010 SRK "
    myQuery += " INNER JOIN SRV010 SRV "
    myQuery += " ON SRV.D_E_L_E_T_ = ' ' "
    myQuery += " AND SRV.RV_FILIAL = LEFT(SRK.RK_FILIAL, 2) "
    myQuery += " AND SRV.RV_COD = SRK.RK_PD "
    myQuery += " WHERE SRK.D_E_L_E_T_ = ' ' "
    myQuery += " AND SRK.RK_PD IN ('516','373','522','523','525','520','440','445','518','521','570','571','450') "
    myQuery += " AND SRK.RK_FILIAL = '" + filial + "' "
    myQuery += " AND SRK.RK_MAT = '" + matricula + "' "
    myQuery += " AND SRK.RK_MESDISS >= '" + periodoAtual + "01' "
    myQuery += " ORDER BY RK_MESDISS DESC "

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