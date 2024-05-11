var venta =
{
    formId:"", form:null, tableId:"", table:null, _GET:{},
    url_exit:"", url_get_fultimo:"", url_get_series:"", url_change_status:"",
    last_unit:"", last_tcambio:1, is_new:false,

    init()
    {
        const ik_cliente = document.getElementById("ik_cliente");
        const sel_documento = document.getElementById("sel_documento");
        const sel_divisa = document.getElementById("sel_divisa");
        const sel_cconsumo = document.getElementById("sel_cconsumo");
        const txt_folio = document.getElementById("txt_folio");
        const txt_tipocambio = document.getElementById("txt_tipocambio");
        const btn_get_folio = document.getElementById("btn_get_folio");
        const btn_guardar = document.getElementById("btn_guardar");
        const btn_reabrir = document.getElementById("btn_reabrir");
        const btn_cerrar = document.getElementById("btn_cerrar");
        const btn_procesar = document.getElementById("btn_procesar");
        const btn_cancelar = document.getElementById("btn_cancelar");
        this.form = document.getElementById(this.formId);
        this.table = document.getElementById(this.tableId);
        this.is_new = (this._GET["_entity_id"] === "_new");

        if (ik_cliente) ik_cliente.change_event = (data) => {
            sel_divisa.value = data.idivisa;
            txt_tipocambio.value = data.tcambio;
            trigger(txt_tipocambio,"change");
        }

        if (sel_documento) sel_documento.addEventListener("change", () => {
            let params = { doctype:sel_documento.value }
            const callback = (opt, obj) => { opt.setAttribute("data-iblock",obj.sys_pk) }
            fillSelect("sel_serie","serie","serie",this.url_get_series,params,{},callback);
            txt_folio.value = "";
        });
        
        if (sel_divisa) sel_divisa.addEventListener("change", () => {
            const opt_divisa = sel_divisa.options[sel_divisa.selectedIndex];
            txt_tipocambio.value = Number(opt_divisa.getAttribute("data-tcambio") ?? "1");
            trigger(txt_tipocambio,"change");
        });

        if (sel_cconsumo) sel_cconsumo.addEventListener("change", (e) => this.changeIAlmacenOfProducts(sel_cconsumo));
        if (txt_tipocambio) txt_tipocambio.addEventListener("change", (e) => this.changeTipoCambioOfProducts(txt_tipocambio));
        if (btn_get_folio) btn_get_folio.addEventListener("click", () => { this.getFolio() });
        if (btn_guardar) btn_guardar.addEventListener("click", (e) => this.submit(btn_guardar));
        if (btn_reabrir) btn_reabrir.addEventListener("click", (e) => this.changeStatus(btn_reabrir));
        if (btn_cerrar) btn_cerrar.addEventListener("click", (e) => this.submit(btn_cerrar));
        if (btn_procesar) btn_procesar.addEventListener("click", (e) => this.changeStatus(btn_procesar));
        if (btn_cancelar) btn_cancelar.addEventListener("click", (e) => this.changeStatus(btn_cancelar));

        this.setKeyboardShortcuts();
        this.setEventTable();
        this.tableSummary();

        if (this.is_new)
        {
            trigger(sel_divisa,"change");
            trigger(sel_documento,"change");
            // ik_cliente.setValue(ik_cliente.getValue());
        }
    },

    setKeyboardShortcuts()
    {
        document.addEventListener("keydown", (e) => {
            // console.log("key: "+ e.key + " | " + "code: " + e.code);
            if (e.key === "Escape") {
                e.preventDefault();
                (this.url_exit !== "")
                    ? window.location.href = this.url_exit
                    : window.location.href = "../";
            }
            if (e.key === "F5") {
                e.preventDefault();
                window.location.reload();
            }
        });
    },

    setEventTable()
    {
        if (!this.table) return;

        const evt = this.table.EdiTable.Const.Events;
        const ik_producto = document.getElementById("ik_producto");
        const btn_add_row = document.getElementById("btn_add_row");
        const btn_del_row = document.getElementById("btn_del_row");

        ik_producto.change_event = (data) => this.addProduct(data);
        btn_add_row.addEventListener("click", () => this.table.AddRow());
        btn_del_row.addEventListener("click", () => this.table.DeleteCurrentRow());
        this.table.setInputKey("codigo",ik_producto);
        this.table.setInputKey("descripcion",ik_producto);

        this.table.Events[evt.StartEdition] = (e) => { this.fillUnitCell(e) };
        this.table.Events[evt.BeforeUpdateCell] = (e) => { this.validateRowCells(e) };
        this.table.Events[evt.ConfirmEdition] = (e) => { this.calculateAmounts(e) };
    },

    getFolio()
    {
        const sel_serie = document.getElementById("sel_serie");
        const opt_serie = sel_serie.options[sel_serie.selectedIndex];
        const txt_folio = document.getElementById("txt_folio");

        if (Number(txt_folio.value) > 0) return;
        
        let iblock = Number(opt_serie.getAttribute("data-iblock"));
        let url = this.url_get_fultimo.replace("@iblock",iblock);

        fetch(url).then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                return;
            }

            txt_folio.value = data.fultimo;
        })
        .catch(error => console.error(error));
    },

    filterDataArray(edt) {
        if (!edt) return [];
        return (edt?.DataArray??[]).filter((row) => { return Object.keys(row??{}).length >= edt.Columns.length })
    },

    submit(relbtn)
    {
        if (!this.form) return;
        if (!this.form.reportValidity()) return;

        let new_stt_adm = Number(relbtn.getAttribute("data-stt-adm"));
        let _detalle = this.filterDataArray(this.table);
        
        let fd = new FormData(this.form);
        fd.append("statusadministrativo",new_stt_adm);
        fd.append("_detalle",JSON.stringify(_detalle));

        let endpoint = "./";
        let method = (Number(fd.get("sys_pk")) > 0) ? "PATCH" : "POST";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                return;
            }

            console.log(data);
        }

        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts", content, 6);
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    },

    changeStatus(relbtn)
    {
        if (!this.url_change_status) return;

        let form_fields = this.form.elements;
        let new_stt_adm = Number(relbtn.getAttribute("data-stt-adm"));

        let fd = new FormData();
        fd.append("sys_pk",form_fields["sys_pk"]);
        fd.append("sys_recver",form_fields["sys_recver"]);
        fd.append("statusadministrativo",new_stt_adm);
        
        let endpoint = this.url_change_status.replace("@iventa",fd.get("sys_pk"));
        let method = (Number(fd.get("sys_pk")) > 0) ? "PATCH" : "POST";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                return;
            }

            console.log(data);
        }
        
        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts", content, 6);
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    },

    changeIAlmacenOfProducts(sel_cconsumo)
    {
        const opt_cconsumo = sel_cconsumo.options[sel_cconsumo.selectedIndex];
        let dtarray = this.table?.DataArray ?? [];
        let ialmacen = Number(opt_cconsumo.getAttribute("data-almacen"));
        
        for (let i = 0; i < dtarray.length; i++) {
            const producto = dtarray[i];
            if (Object.keys(producto??{}).length < this.table.Columns.length) continue;

            producto["ialmacen"] = ialmacen;
        }
    },

    changeTipoCambioOfProducts(txt_tipocambio)
    {
        let tcambio = Number(txt_tipocambio.value);
        let dtarray = this.table?.DataArray ?? [];
        if (tcambio <= 0 || this.last_tcambio === tcambio) return;

        for (let i = 0; i < dtarray.length; i++) {
            const producto = dtarray[i];
            if (Object.keys(producto??{}).length < this.table.Columns.length) continue;

            let precio = Math.mul(producto.precio,this.last_tcambio);
            precio = Math.div(precio,tcambio);

            producto["precio"] = precio;
            producto["tipocambio"] = tcambio;

            this.edtProduct(producto,i);
        }

        this.last_tcambio = tcambio;
    },

    tableSummary()
    {
        if (!this.table) return;

        const lbl_subtotal = document.getElementById("lbl_subtotal");
        const lbl_descuentos = document.getElementById("lbl_descuentos");
        const lbl_impuestos = document.getElementById("lbl_impuestos");
        const lbl_total = document.getElementById("lbl_total");
        
        const sel_divisa = document.getElementById("sel_divisa");
        const opt_divisa = sel_divisa.options[sel_divisa.selectedIndex];

        let langcode = (new Intl.NumberFormat()).resolvedOptions().locale;
        let divisa = opt_divisa.getAttribute("data-codigo").toUpperCase();
        let dtarray = this.table?.DataArray ?? [];

        let subtotal = 0, descuentos = 0, impuestos = 0, total = 0;

        for (let i = 0; i < dtarray.length; i++) {
            const row = dtarray[i];
            if (Object.keys(row??{}).length < this.table.Columns.length) continue;
            
            subtotal = Math.add(subtotal,Number(row.subtotal));
            descuentos = Math.add(descuentos,Number(row.descuentos));
            impuestos = Math.add(impuestos,Number(row.impuestos));
            total = Math.add(total,Number(row.importe));
        }

        const formatter = new Intl.NumberFormat(langcode, {
            style: "currency",
            currency: divisa,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        lbl_subtotal.textContent = formatter.format(subtotal);
        lbl_descuentos.textContent = formatter.format(descuentos);
        lbl_impuestos.textContent = formatter.format(impuestos);
        lbl_total.textContent = formatter.format(total);
    },

    joinUnidades(...unidades) 
    {
        let obj = {};

        for (let i = 0; i < unidades.length; i++) {
            const u = unidades[i];
            if (typeof u === "string" && u.trim() != "")
                obj[u] = u;
        }

        return JSON.stringify(obj);
    },

    calculateTaxes(prod)
    {
        let costo = Number(prod.precio);
        let cantidad = Number(prod.cantidad);
        let descuentos = Number(prod.descuentos);
        let i1_tasa = Number(prod.i1_tasa);
        let i2_tasa = Number(prod.i2_tasa);
        let i3_tasa = Number(prod.i3_tasa);
        let i4_tasa = Number(prod.i4_tasa);

        let subtotal = Math.mul(costo,cantidad);
        let sub_desc = Math.sub(subtotal,descuentos);
        let impuesto1 = Math.mul(sub_desc,i1_tasa);
        let impuesto2 = Math.mul(sub_desc,i2_tasa);
        let i1_i2 = Math.add(impuesto1,impuesto2);
        let sub_desc_i1_i2 = Math.add(sub_desc,i1_i2);
        let impuesto3 = Math.mul(sub_desc_i1_i2,i3_tasa);
        let impuesto4 = Math.mul(sub_desc_i1_i2,i4_tasa);
        let i3_i4 = Math.add(impuesto3,impuesto4);
        let impuestos = Math.add(i1_i2,i3_i4);
        let total = Math.add(sub_desc,impuestos);

        let importes =
        {
            costo: costo,
            cantidad: cantidad,
            subtotal: subtotal,
            descuentos: descuentos,
            impuestos: impuestos,
            total: total,
            impuesto1: impuesto1,
            impuesto2: impuesto2,
            impuesto3: impuesto3,
            impuesto4: impuesto4,
        }

        return importes;
    },

    addProduct(p)
    {
        if (!p) return;

        const sel_cconsumo = document.getElementById("sel_cconsumo");
        const opt_cconsumo = sel_cconsumo.options[sel_cconsumo.selectedIndex];

        let dtarray = this.table?.DataArray ?? [];
        let curr_row = this.table.CurrentRowIndex();
        let i = this.calculateTaxes(p);
        let lu = this.joinUnidades(p.unidada,p.unidadb,p.unidadc,p.unidadd,p.unidade);
        let ialmacen = Number(opt_cconsumo.getAttribute("data-almacen"));
        
        let producto = 
        {
            // campos visibles en el editable.
            codigo: p.codigo,
            descripcion: p.descripcion,
            unidad: p.unidada,
            precio: i.costo,
            cantidad: i.cantidad,
            subtotal: i.subtotal,
            descuentos: i.descuentos,
            impuestos: i.impuestos,
            importe: i.total,
            notas: "",

            // campos para el insert.
            descuento1: i.descuentos,
            descuento2: 0,
            factor: 1,
            impuesto1: i.impuesto1,
            impuesto2: i.impuesto2,
            impuesto3: i.impuesto3,
            impuesto4: i.impuesto4,
            status: 1, // cPor_entregar
            tipocambio: p.tipocambio,
            xfacturar: 1,
            xsalir: 1,
            ialmacen: ialmacen,
            iproducto: p.sys_pk,

            // campos extras para operaciones.
            i1_tasa: p.i1_tasa,
            i2_tasa: p.i2_tasa,
            i3_tasa: p.i3_tasa,
            i4_tasa: p.i4_tasa,
            unidada: p.unidada,
            unidadb: p.unidadb,
            unidadc: p.unidadc,
            unidadd: p.unidadd,
            unidade: p.unidade,
            factorb: p.factorb,
            factorc: p.factorc,
            factord: p.factord,
            factore: p.factore,
            list_unidades: lu
        }

        if (curr_row < 0) curr_row = 0;
        if (!dtarray[curr_row]) dtarray[curr_row] = {};
        
        dtarray[curr_row] = producto
        
        this.table.UpdateRow(curr_row);
        this.table.NavTo(curr_row,2);
        this.tableSummary();
    },

    edtProduct(producto, rowIndex) {
        let i = this.calculateTaxes(producto);

        producto["precio"] = i.costo;
        producto["cantidad"] = i.cantidad;
        producto["subtotal"] = i.subtotal;
        producto["descuentos"] = i.descuentos;
        producto["impuestos"] = i.impuestos;
        producto["importe"] = i.total;
        producto["costototal"] = i.costo;
        producto["descuento1"] = i.descuentos;
        producto["impuesto1"] = i.impuesto1;
        producto["impuesto2"] = i.impuesto2;
        producto["impuesto3"] = i.impuesto3;
        producto["impuesto4"] = i.impuesto4;

        this.table.UpdateRow(rowIndex);
        this.tableSummary();
    },

    fillUnitCell(e)
    {
        let coldef = e.sender.GetColumnDefOfTd(e.td);
        let curr_row = this.table.CurrentRowIndex();
        let producto = this.table?.DataArray[curr_row] ?? {};

        if (Object.keys(producto ?? {}).length < this.table.Columns.length) return;
        if (coldef.field !== "unidad") return;

        if (!producto.list_unidades) {
            producto["list_unidades"] = this.joinUnidades(producto.unidada,producto.unidadb,producto.unidadc,producto.unidadd,producto.unidade);
        }
        coldef.options = JSON.parse(producto.list_unidades);
    },

    validateRowCells(e)
    {
        let curr_row = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let producto = this.table?.DataArray[curr_row] ?? {};

        if (Object.keys(producto ?? {}).length < this.table.Columns.length) return;

        if (field === "unidad" && e.text.trim() === "") {
            show_alert("#tbl_alerts","Debe elegir la unidad.",3);
            e.cancel = true;
            return false;
        }
        if ((field === "precio" || field === "cantidad") && Number(e.text.trim()) <= 0) {
            show_alert("#tbl_alerts","El valor debe ser mayor que 0.",3);
            e.cancel = true;
            return false;
        }
        if (field === "descuentos" && Number(e.text.trim()) < 0) {
            show_alert("#tbl_alerts","El valor no puede ser menor que 0.",3);
            e.cancel = true;
            return false;
        }
    },

    calculateAmountsXUnits(e)
    {
        let curr_row = e.sender.RowIndexOfTd(e.td);
        let producto = this.table?.DataArray[curr_row] ?? {};

        if (Object.keys(producto ?? {}).length < this.table.Columns.length) return;
        if (e.coldef.field !== "unidad") return;
        
        this.last_unit = producto.unidad;
        producto["unidad"] = e.text;

        switch (e.text) {
            case producto.unidada:
                if (this.last_unit == producto.unidada) return;

                let precioA = 0;
                if (this.last_unit == producto.unidadb) precioA = Math.div(producto.precio,producto.factorb);
                else if (this.last_unit == producto.unidadc) precioA = Math.div(producto.precio,producto.factorc);
                else if (this.last_unit == producto.unidadd) precioA = Math.div(producto.precio,producto.factord);
                else if (this.last_unit == producto.unidade) precioA = Math.div(producto.precio,producto.factore);
                
                producto["precio"] = precioA;
                producto["factor"] = 1; // factora
                this.last_unit = producto.unidada;

                this.edtProduct(producto,curr_row);
                break;
            case producto.unidadb:
                if (this.last_unit == producto.unidadb) return;

                let precioB = 0;
                if (this.last_unit == producto.unidada) precioB = Math.mul(producto.precio,producto.factorb);
                else if (this.last_unit == producto.unidadc) {
                    let x = Math.mul(producto.factorb,producto.precio);
                    precioB = Math.div(x,producto.factorc);
                }
                else if (this.last_unit == producto.unidadd) {
                    let x = Math.mul(producto.factorb,producto.precio);
                    precioB = Math.div(x,producto.factord);
                }
                else if (this.last_unit == producto.unidade) {
                    let x = Math.mul(producto.factorb,producto.precio);
                    precioB = Math.div(x,producto.factore);
                }

                producto["precio"] = precioB;
                producto["factor"] = producto.factorb;
                this.last_unit = producto.unidadb;

                this.edtProduct(producto,curr_row);
                break;
            case producto.unidadc:
                if (this.last_unit == producto.unidadc) return;
                
                let precioC = 0;
                if (this.last_unit == producto.unidada) precioC = Math.mul(producto.precio,producto.factorc);
                else if (this.last_unit == producto.unidadb) {
                    let x = Math.mul(producto.factorc,producto.precio);
                    precioC = Math.div(x,producto.factorb);
                }
                else if (this.last_unit == producto.unidadd) {
                    let x = Math.mul(producto.factorc,producto.precio);
                    precioC = Math.div(x,producto.factord);
                }
                else if (this.last_unit == producto.unidade) {
                    let x = Math.mul(producto.factorc,producto.precio);
                    precioC = Math.div(x,producto.factore);
                }

                producto["precio"] = precioC;
                producto["factor"] = producto.factorc;
                this.last_unit = producto.unidadc;

                this.edtProduct(producto,curr_row);
                break;
            case producto.unidadd:
                if (this.last_unit == producto.unidadd) return;
                
                let precioD = 0;
                if (this.last_unit == producto.unidada) precioD = Math.mul(producto.precio,producto.factord);
                else if (this.last_unit == producto.unidadb) {
                    let x = Math.mul(producto.factord,producto.precio);
                    precioD = Math.div(x,producto.factorb);
                }
                else if (this.last_unit == producto.unidadc) {
                    let x = Math.mul(producto.factord,producto.precio);
                    precioD = Math.div(x,producto.factorc);
                }
                else if (this.last_unit == producto.unidade) {
                    let x = Math.mul(producto.factord,producto.precio);
                    precioD = Math.div(x,producto.factore);
                }
                
                producto["precio"] = precioD;
                producto["factor"] = producto.factord;
                this.last_unit = producto.unidadd;

                this.edtProduct(producto,curr_row);
                break;
            case producto.unidade:
                if (this.last_unit == producto.unidade) return;
                
                let precioE = 0;
                if (this.last_unit == producto.unidada) precioE = Math.mul(producto.precio,producto.factore);
                else if (this.last_unit == producto.unidadb) {
                    let x = Math.mul(producto.factore,producto.precio);
                    precioE = Math.div(x,producto.factorb);
                }
                else if (this.last_unit == producto.unidadc) {
                    let x = Math.mul(producto.factore,producto.precio);
                    precioE = Math.div(x,producto.factorc);
                }
                else if (this.last_unit == producto.unidadd) {
                    let x = Math.mul(producto.factore,producto.precio);
                    precioE = Math.div(x,producto.factord);
                }

                producto["precio"] = precioE;
                producto["factor"] = producto.factore;
                this.last_unit = producto.unidade;

                this.edtProduct(producto,curr_row);
                break;

            default:
                show_alert("#tbl_alerts","Unidad: " + e.text + " no se encuentra en el diccionario.", 3);
                break;
        }
    },

    calculateAmounts(e)
    {
        let curr_row = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let producto = this.table?.DataArray[curr_row] ?? {};

        if (Object.keys(producto ?? {}).length < this.table.Columns.length) return;
        if (!["unidad","precio","cantidad","descuentos"].includes(field)) return;

        if (field === "unidad") {
            this.calculateAmountsXUnits(e);
            return;
        }

        if (field === "precio") producto["precio"] = Number(e.text.trim());
        if (field === "cantidad") producto["cantidad"] = Number(e.text.trim());
        if (field === "descuentos") producto["descuentos"] = Number(e.text.trim());
        
        this.edtProduct(producto,curr_row);
    },
}