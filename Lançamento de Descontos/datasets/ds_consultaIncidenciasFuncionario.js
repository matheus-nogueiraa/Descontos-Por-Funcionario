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

    if (constraints.length > 0) {
        for (var c = 0; c < constraints.length; c++) {
            if (constraints[c].fieldName == "filial") {
                filial = ("" + constraints[c].initialValue + "").trim();
            }
            if (constraints[c].fieldName == "matricula") {
                matricula = ("" + constraints[c].initialValue + "").trim();
            }
        }
    }

    if (!filial || !matricula) {
        newDataset.addColumn('ERRO');
        newDataset.addRow(['Filial ou Matrícula Inválidos']);
        return newDataset;
    }

    myQuery += " SELECT "
    myQuery += "     RGB.RGB_FILIAL codFilial, "
    myQuery += "     RGB.RGB_PROCES codProcesso, "
    myQuery += "     RGB.RGB_PERIOD codPeriodo, "
    myQuery += "     RGB.RGB_SEMANA nroPagamento, "
    myQuery += "     RGB.RGB_ROTEIR roteiro, "
    myQuery += "     RGB.RGB_MAT matricula, "
    myQuery += "     RGB.RGB_PD codVerba, "
    myQuery += "     SRV.RV_DESC descVerba, "
    myQuery += "     RGB.RGB_HORAS horas, "
    myQuery += "     RGB.RGB_VALOR valor, "
    myQuery += "     RGB.RGB_DTREF dtReferencia, "
    myQuery += "     RGB.RGB_CC centroCusto, "
    myQuery += "     RGB.RGB_PARCEL nroParcela, "
    myQuery += "     RGB.RGB_SEQ seqVerba "
    myQuery += " FROM RGB010 RGB "
    myQuery += " INNER JOIN SRV010 SRV "
    myQuery += " ON SRV.D_E_L_E_T_ = ' ' "
    myQuery += " AND SRV.RV_FILIAL = LEFT(RGB.RGB_FILIAL, 2) "
    myQuery += " AND SRV.RV_COD = RGB.RGB_PD "
    myQuery += " WHERE RGB.D_E_L_E_T_ = ' ' "
    myQuery += " AND RGB.RGB_PD IN ('516','373','522','523','520','440','445','518','521','570','571','450') "
    myQuery += " AND RGB.RGB_FILIAL = '" + filial + "' "
    myQuery += " AND RGB.RGB_MAT = '" + matricula + "' "
    myQuery += " ORDER BY RGB_PERIOD DESC "

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