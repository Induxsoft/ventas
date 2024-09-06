var venta =
{
    formId:"", form:null, ff:null, tableId:"", table:null, coldef:null, _GET:{}, docs_included:{},
    url_exit:"", url_get_fultimo:"", url_get_series:"", url_change_status:"", url_get_dventa:"", url_get_docs_included:"", url_get_lotser:"", url_get_precio:"",
    last_unit:"", last_tcambio:1, is_new:false, idocumento:0, cur_stt_adm:0, decimals:2, enable_lotes:true, enable_series:true, error_timeout:7, is_on_submit:false, is_requesting:false,

    init()
    {
        const ik_cliente = document.getElementById("ik_cliente");
        const ik_agente = document.getElementById("ik_agente");
        const ik_repartidor = document.getElementById("ik_repartidor");
        const ik_porteador = document.getElementById("ik_porteador");
        const sel_documento = document.getElementById("sel_documento");
        const sel_divisa = document.getElementById("sel_divisa");
        const sel_cconsumo = document.getElementById("sel_cconsumo");
        const txt_tipocambio = document.getElementById("txt_tipocambio");
        const txt_pcomision = document.getElementById("txt_pcomision");
        const btn_get_folio = document.getElementById("btn_get_folio");
        const btn_guardar = document.getElementById("btn_guardar");
        const btn_reabrir = document.getElementById("btn_reabrir");
        const btn_cerrar = document.getElementById("btn_cerrar");
        const btn_procesar = document.getElementById("btn_procesar");
        const btn_cancelar = document.getElementById("btn_cancelar");
        const btn_new_doc = document.getElementById("btn_new_doc");
        const toast = document.getElementById("toast");
        this.form = document.getElementById(this.formId);
        this.ff = this.form.elements;
        this.table = document.getElementById(this.tableId);
        this.is_new = (this._GET["_entity_id"] === "_new");

        if (ik_cliente) ik_cliente.change_event = (data) => {
            if (!data) return;
            sel_divisa.value = data.idivisa;
            txt_tipocambio.value = data.tcambio;
            trigger(txt_tipocambio,"change");
        }

        if (ik_agente) ik_agente.change_event = (data) => { txt_pcomision.value = Number(data.pcomision); }
        
        if (sel_divisa) sel_divisa.addEventListener("change", () => {
            const opt_divisa = sel_divisa.options[sel_divisa.selectedIndex];
            txt_tipocambio.value = Number(opt_divisa.getAttribute("data-tcambio") ?? "1");
            trigger(txt_tipocambio,"change");
        });

        if (sel_documento) sel_documento.addEventListener("change", (e) => this.changeDocumento(sel_documento));
        if (sel_cconsumo) sel_cconsumo.addEventListener("change", (e) => this.changeIAlmacenOfProducts(sel_cconsumo));
        if (txt_tipocambio) txt_tipocambio.addEventListener("change", (e) => this.changeTipoCambioOfProducts(txt_tipocambio));
        if (btn_get_folio) btn_get_folio.addEventListener("click", () => { this.getFolio() });
        if (btn_guardar) btn_guardar.addEventListener("click", (e) => this.submit(btn_guardar));
        if (btn_reabrir) btn_reabrir.addEventListener("click", (e) => this.changeStatus(btn_reabrir));
        if (btn_cerrar) btn_cerrar.addEventListener("click", (e) => this.submit(btn_cerrar));
        if (btn_procesar) btn_procesar.addEventListener("click", (e) => this.submit(btn_procesar));
        if (btn_cancelar) btn_cancelar.addEventListener("click", (e) => this.changeStatus(btn_cancelar));
        if (btn_new_doc) btn_new_doc.addEventListener("click", (e) => this.exportarA(btn_new_doc.getAttribute("data-new-doc")));
        
        if (toast) toast.addEventListener('hidden.bs.toast', function (e) {
            document.getElementById("toast-title").innerText = "";
            document.getElementById("toast-body").innerText = "";
        })

        this.setKeyboardShortcuts();
        this.setTableEvents();
        this.tableSummary();
        this.toggleEdtColumns();

        if (this.is_new)
        {
            trigger(sel_divisa,"change");
            trigger(sel_documento,"change");
            // this.includeDVenta(this._GET["src"]);
            // ik_cliente.setValue(ik_cliente.getValue());
        }
        else
        {
            this.getDocsIncluded();
            this.toggleButtonVisibility();
            readonlyControls(["sel_divisa"], (this.filterData().length > 0));
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

    setTableEvents()
    {
        if (!this.table) return;
        if (this.coldef === null) this.coldef = JSON.parse(JSON.stringify(this.table.Columns));

        const evt = this.table.EdiTable.Const.Events;
        const ik_producto = document.getElementById("ik_producto");
        const ik_lot_prod = document.getElementById("ik_lot_prod");
        const ik_ser_prod = document.getElementById("ik_ser_prod");
        const ik_link_doc = document.getElementById("ik_link_doc");
        const btn_add_row = document.getElementById("btn_add_row");
        const btn_del_row = document.getElementById("btn_del_row");
        const btn_add_lote = document.getElementById("btn_add_lote");
        const btn_add_serie = document.getElementById("btn_add_serie");
        const btn_add_doc = document.getElementById("btn_add_doc");
        const btn_del_doc = document.getElementById("btn_del_doc");
        const btn_includes = document.getElementById("btn_includes");

        ik_producto.change_event = (data) => this.addProduct(data);
        ik_lot_prod.change_event = (data) => this.addLoteToProduct(data);
        ik_ser_prod.change_event = (data) => this.addSerieToProduct(data);
        ik_link_doc.change_event = (data) => this.includeDVenta(data);
        btn_add_row.addEventListener("click", () => ik_producto.searchText("",false));
        btn_del_row.addEventListener("click", () => this.delProduct());
        btn_add_lote.addEventListener("click", () => this.launchIkLoteSerie(ik_lot_prod));
        btn_add_serie.addEventListener("click", () => this.launchIkLoteSerie(ik_ser_prod));
        btn_add_doc.addEventListener("click", () => this.launchIkLinkDocument(ik_link_doc));
        btn_del_doc.addEventListener("click", () => this.removeDVenta());
        btn_includes.addEventListener("click", () => this.launchModalDocsIncluded());
        
        this.table.setInputKey("codigo",ik_producto);
        this.table.setInputKey("descripcion",ik_producto);
        if (this.enable_lotes) this.table.setInputKey("lote",ik_lot_prod);
        if (this.enable_series) this.table.setInputKey("serie",ik_ser_prod);

        this.table.onTdPaint = (td,irow,icol,field) => this.coloringIncludedRows(td,irow,icol,field);
        this.table.ButtonOnClick = (irow,icol,coldef) => this.cellsButtonClickHandler(irow,icol,coldef);

        this.table.Events[evt.RowDeleted] = (e) => { readonlyControls(["sel_divisa"], (this.filterData().length > 0)) };
        this.table.Events[evt.EnterCell] = (e) => 
        {
            let coldef = e.sender.GetColumnDefOfTd(e.td);
            let curr_row = this.table.RowIndexOfTd(e.td);
            let curr_col = this.table.ColIndexOfTd(e.td);
            let producto = this.table.DataArray[curr_row];

            this.table.Columns[curr_col].type = this.coldef[curr_col].type;
            if (Object.keys(producto ?? {}).length < this.table.Columns.length) return;

            this.disableIncludedRows(curr_col,coldef.field,producto);
            // this.disableCells(curr_col,coldef.field,producto);
        };
        this.table.Events[evt.StartEdition] = (e) => { this.fillUnitCell(e) };
        this.table.Events[evt.BeforeUpdateCell] = (e) => { this.validateRowCells(e) };
        this.table.Events[evt.ConfirmEdition] = (e) => { this.calculateAmounts(e) };

        this.table._printRows();
    },

    convertirADivisa(value,tcp,tcd,mode)
    {
        if (mode === "doc") return Math.RoundTo(Math.div(Math.mul(value,tcp),tcd), this.decimals);
        if (mode === "prod") return Math.RoundTo(Math.div(Math.mul(value,tcd),tcp), this.decimals);
        return value;
    },

    toggleButtonVisibility()
    {
        const btn_new_doc = document.getElementById("btn_new_doc");
        const txt_new_doc = document.getElementById("txt_new_doc");

        hideControls(["btn_guardar","btn_reabrir","btn_cerrar","btn_procesar","btn_cancelar","btn_add_doc"]);
        switch (this.idocumento) {
            case 1: //Cotización
            {
                if (btn_new_doc) btn_new_doc.setAttribute("data-new-doc",2);
                if (txt_new_doc) txt_new_doc.innerText = "Pedir";
                switch (this.cur_stt_adm) {
                    case 0: //No aplica
                        hideControls(["btn_guardar","btn_cerrar"],false);
                        break;
                    case 1: //Abierto
                        hideControls(["btn_guardar","btn_cerrar","btn_cancelar"],false);
                        break;
                    case 2: //Cerrado
                        hideControls(["btn_reabrir","btn_cancelar"],false);
                        break;
                    case 3: //Procesado
                        hideControls(["btn_cancelar"],false);
                        break;
                }
                break;
            }
            case 2: //Pedido
            {
                if (btn_new_doc) btn_new_doc.setAttribute("data-new-doc",3);
                if (txt_new_doc) txt_new_doc.innerText = "Recibir";
                this.table.changeColumnTitle("cotizado","Cotizado");
                switch (this.cur_stt_adm) {
                    case 0: //No aplica
                        hideControls(["btn_guardar","btn_cerrar","btn_add_doc"],false);
                        break;
                    case 1: //Abierto
                        hideControls(["btn_guardar","btn_cerrar","btn_cancelar","btn_add_doc"],false);
                        break;
                    case 2: //Cerrado
                        hideControls(["btn_reabrir","btn_cancelar"],false);
                        break;
                    case 3: //Procesado
                        hideControls(["btn_cancelar"],false);
                        break;
                }
                break;
            }
            case 3: //Remisión
            case 6: //Ticket
            {
                if (btn_new_doc) btn_new_doc.setAttribute("data-new-doc",4);
                if (txt_new_doc) txt_new_doc.innerText = "Facturar";
                this.table.changeColumnTitle("cotizado","Recibido");
                switch (this.cur_stt_adm) {
                    case 0: //No aplica
                        hideControls(["btn_guardar","btn_cerrar","btn_procesar","btn_add_doc"],false);
                        break;
                    case 1: //Abierto
                        hideControls(["btn_guardar","btn_cerrar","btn_procesar","btn_cancelar","btn_add_doc"],false);
                        break;
                    case 2: //Cerrado
                        hideControls(["btn_reabrir","btn_procesar","btn_cancelar"],false);
                        break;
                    case 3: //Procesado
                        hideControls(["btn_cancelar"],false);
                        break;
                }
                break;
            }
            case 4: //Factura
            {
                if (btn_new_doc) btn_new_doc.setAttribute("data-new-doc",5);
                if (txt_new_doc) txt_new_doc.innerText = "Devolver";
                this.table.changeColumnTitle("cotizado","Facturado");
                switch (this.cur_stt_adm) {
                    case 0: //No aplica
                        hideControls(["btn_guardar","btn_cerrar","btn_procesar","btn_add_doc"],false);
                        break;
                    case 1: //Abierto
                        hideControls(["btn_guardar","btn_cerrar","btn_procesar","btn_cancelar","btn_add_doc"],false);
                        break;
                    case 2: //Cerrado
                        hideControls(["btn_reabrir","btn_procesar","btn_cancelar"],false);
                        break;
                    case 3: //Procesado
                        hideControls(["btn_cancelar"],false);
                        break;
                }
                break;
            }
            case 5: //Nora de crédito
            {
                if (btn_new_doc) btn_new_doc.setAttribute("data-new-doc",0);
                if (txt_new_doc) txt_new_doc.innerText = "";
                this.table.changeColumnTitle("cotizado","Devuelto");
                switch (this.cur_stt_adm) {
                    case 0: //No aplica
                        hideControls(["btn_guardar","btn_cerrar","btn_procesar","btn_add_doc"],false);
                        break;
                    case 1: //Abierto
                        hideControls(["btn_guardar","btn_cerrar","btn_procesar","btn_cancelar","btn_add_doc"],false);
                        break;
                    case 2: //Cerrado
                        hideControls(["btn_reabrir","btn_procesar","btn_cancelar"],false);
                        break;
                    case 3: //Procesado
                        hideControls(["btn_cancelar"],false);
                        break;
                }
                break;
            }
            default:
                console.warn("Documento seleccionado desconocido.");
                break;
        }
    },

    toggleEdtColumns()
    {
        if (!this.table) return;

        const includes = (this.table?.DataArray ?? []).filter(row => (row.origen ?? "") !== "");
        let hide = (includes.length <= 0);

        this.table.hideColumn("origen",hide);
        this.table.hideColumn("cotizado",hide);

        readonlyControls(["ik_cliente","sel_documento"],!hide);
        hideControls(["btn_includes"],hide)
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

    getDocsIncluded()
    {
        let iventa = Number(this._GET["_entity_id"] ?? "-1");
        if (iventa <= 0) return;

        let url = this.url_get_docs_included.replace("@iventa",iventa);
        fetch(url).then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                return;
            }

            this.docs_included = data;
        })
        .catch(error => console.error(error));
    },

    includeDVenta(venta)
    {
        let iventa = (typeof venta === "object") ? Number(venta?.sys_pk ?? "-1") : Number(venta || "-1");
        if (iventa <= 0) return;

        let url = this.url_get_dventa.replace("@iventa",iventa);
        fetch(url).then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                return;
            }
            if (Object.keys(this.docs_included).includes(iventa.toString())) return;

            data.forEach(p => {
                this.addProduct(p);
            });

            if (typeof venta === "object") this.docs_included[iventa] = venta;
        })
        .catch(error => console.error(error));
    },

    removeDVenta()
    {
        const tbl_docs_included = document.getElementById("tbl_docs_included");
        let array = tbl_docs_included?.DataArray ?? [];
        let curr_row = tbl_docs_included.CurrentRowIndex();
        let venta = array[curr_row] ?? {};

        if (curr_row < 0) return;

        let detalle = this.table.DataArray.filter(obj => (obj?.origen ?? "") !== venta.referencia);
        this.table.DataArray = detalle;
        this.table._printRows();
        this.toggleEdtColumns();
        
        tbl_docs_included.DeleteRow(curr_row);
        delete this.docs_included[venta.sys_pk];
    },

    exportarA(documento)
    {
        let url = "/!/ventas/venta/_new/?src="+this._GET["_entity_id"]+"&doc="+documento
        window.location.href = url;
    },

    filterData() {
        return (this.table?.DataArray??[]).filter((row) => { return Object.keys(row??{}).length >= this.table.Columns.length });
    },

    launchIkLinkDocument(ik_link_doc)
    {
        let icliente = Number(this.ff["icliente"].value);
        let idivisa = Number(this.ff["sel_divisa"].value);
        let doctype = Number(this.ff["sel_documento"].value);
        
        if (icliente <= 0) {
            alert("Debe seleccionar un cliente para continuar");
            return
        }

        let params = 
        {
            icliente: icliente,
            idivisa: idivisa,
            doctype: doctype
        }

        let endpoint = InduxsoftCrudlModel.UrlReplace(ik_link_doc.getAttribute("data-source"),params);

        ik_link_doc.setAttribute("data-source",endpoint);
        ik_link_doc.searchText("",false);
    },

    launchIkLoteSerie(ik)
    {
        this.url_get_lotser = ik.getAttribute("data-source");
        let curr_row = this.table.CurrentRowIndex();
        let producto = (this.table?.DataArray??[])[curr_row] ?? {};

        if (curr_row < 0) return;
        if (Object.keys(producto).length < this.table.Columns.length) return;
        
        const sel_cconsumo = document.getElementById("sel_cconsumo");
        const opt_cconsumo = sel_cconsumo.options[sel_cconsumo.selectedIndex];
        let ialmacen = Number(opt_cconsumo.getAttribute("data-almacen") ?? 0);

        if (ialmacen <= 0) {
            alert("No se ha seleccionado un centro de consumo o el seleccionado no cuenta con un almacen vinculado.");
            return;
        }
        if (ik.id === "ik_lot_prod" && !producto.reqlote) {
            alert("El producto seleccionado no requiere lote");
            return;
        }
        if (ik.id === "ik_ser_prod" && !producto.reqserie) {
            alert("El producto seleccionado no requiere serie");
            return;
        }

        let params =
        {
            iproducto: producto.iproducto,
            ialmacen: ialmacen
        }
        let endpoint = InduxsoftCrudlModel.UrlReplace(this.url_get_lotser,params);

        ik.setAttribute("data-source",endpoint);
        ik.searchText("%",false);
    },

    launchModalDocsIncluded()
    {
        const tbl_docs_included = document.getElementById("tbl_docs_included");
        let data = Object.values(this.docs_included);

        tbl_docs_included.AutoAddRow = false;
        tbl_docs_included.AutoDelRow = false;
        tbl_docs_included.EverMove = false;

        tbl_docs_included.DataArray = data;
        tbl_docs_included._printRows();

        showModal("mdl_docs_included");
    },

    addLoteToProduct(data)
    {
        let curr_row = this.table.CurrentRowIndex();
        let producto = this.table.DataArray[curr_row];
        producto["lote"] = data?.numero ?? "";
        producto["fcad"] = data?.fcaducidad ?? "";
        this.table.UpdateRow(curr_row);
    },

    addSerieToProduct(data)
    {
        let curr_row = this.table.CurrentRowIndex();
        let producto = this.table.DataArray[curr_row];
        producto["serie"] = data?.numero ?? "";
        this.table.UpdateRow(curr_row);
    },

    submit(relbtn)
    {
        if (!this.form) return;
        if (this.is_on_submit) return;
        if (!this.form.reportValidity()) return;
        let _detalle = this.filterData();
        if (!this.validateLoteSerie(_detalle)) return;
        
        relbtn.disabled = true;
        this.is_on_submit = true;

        let new_stt_adm = Number(relbtn.getAttribute("data-stt-adm"));
        let included = Object.keys(this.docs_included).join(",");
        
        let fd = new FormData(this.form);
        fd.append("statusadministrativo",new_stt_adm);
        fd.append("_detalle",JSON.stringify(_detalle));
        fd.append("docs_included_id", included);

        let endpoint = "./";
        let method = (Number(fd.get("sys_pk")) > 0) ? "PATCH" : "POST";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                relbtn.disabled = false;
                this.is_on_submit = false;
                return
            }

            window.location.href = data.url_redir;
        }

        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts", content, this.error_timeout);
            relbtn.disabled = false;
            this.is_on_submit = false;
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    },

    validateLoteSerie(detalle)
    {
        let Ok = true;

        if (!this.enable_lotes && !this.enable_series) return Ok;

        for (let i = 0; i < detalle.length; i++) {
            const row = detalle[i];
            
            if (this.enable_lotes && Boolean(row.reqlote) && (row.lote??"").trim() === "") {
                alert(`No es posible continuar, el producto ${row.codigo} - ${row.descripcion} requiere un número de lote.`);
                Ok = false;
                break;
            }

            if (this.enable_series && Boolean(row.reqserie) && (row.serie??"").trim() === "") {
                alert(`No es posible continuar, el producto ${row.codigo} - ${row.descripcion} requiere un número de serie.`);
                Ok = false;
                break;
            }
        }

        return Ok;
    },

    changeStatus(relbtn)
    {
        if (!this.url_change_status) return;
        if (this.is_on_submit) return;

        relbtn.disabled = true;
        this.is_on_submit = true;
        let new_stt_adm = Number(relbtn.getAttribute("data-stt-adm"));

        let fd = new FormData();
        fd.append("sys_pk",Number(this.ff["sys_pk"].value));
        fd.append("sys_recver",Number(this.ff["sys_recver"].value));
        fd.append("statusadministrativo",new_stt_adm);
        
        let endpoint = this.url_change_status.replace("@iventa",fd.get("sys_pk"));
        let method = (Number(fd.get("sys_pk")) > 0) ? "PATCH" : "POST";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                relbtn.disabled = false;
                this.is_on_submit = false;
                return
            }

            window.location.href = data.url_redir;
        }
        
        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts", content, this.error_timeout);
            relbtn.disabled = false;
            this.is_on_submit = false;
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    },

    changeDocumento(sel_documento)
    {
        let idocumento = Number(sel_documento.value);
        let params = { doctype: idocumento }

        const callback = (opt, obj) => { opt.setAttribute("data-iblock",obj.sys_pk) }
        fillSelect("sel_serie","serie","serie",this.url_get_series,params,{},callback);
        
        document.getElementById("txt_folio").value = "";
        this.idocumento = idocumento;
        this.toggleButtonVisibility();
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
            minimumFractionDigits: this.decimals,
            maximumFractionDigits: this.decimals
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

    precioProducto(iproducto,cantidad)
    {
        let params = {
            iproducto: Number(iproducto),
            icliente: Number(this.ff["icliente"].value),
            icconsumo: Number(this.ff["icconsumo"].value),
            cantidad: Number(cantidad)
        };
        let url = InduxsoftCrudlModel.UrlReplace(this.url_get_precio,params);

        return new Promise((resolve,reject) => {
            fetch(url).then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    resolve(-1);
                    return
                }
                resolve(data.precio);
            })
            .catch(error => {
                alert("Ocurrio un error al obtener el precio del producto, se tomará el 'Precio 1'.");
                console.error(error);
                resolve(-1);
            });
        });
    },

    calculateTaxes(prod)
    {
        let precio = Number(prod?._precio || prod.precio);
        let tcp = Number(prod.tipocambio);
        let tcd = Number(this.ff["tipocambio"].value ?? "1");

        let costo = this.convertirADivisa(precio,tcp,tcd,"doc");
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
            subtotal: Math.RoundTo(subtotal,this.decimals),
            descuentos: Math.RoundTo(descuentos,this.decimals),
            impuestos: Math.RoundTo(impuestos,this.decimals),
            total: Math.RoundTo(total,this.decimals),
            impuesto1: Math.RoundTo(impuesto1,this.decimals),
            impuesto2: Math.RoundTo(impuesto2,this.decimals),
            impuesto3: Math.RoundTo(impuesto3,this.decimals),
            impuesto4: Math.RoundTo(impuesto4,this.decimals),
        }

        return importes;
    },

    async addProduct(p)
    {
        if (!p) return;

        const sel_cconsumo = document.getElementById("sel_cconsumo");
        const opt_cconsumo = sel_cconsumo.options[sel_cconsumo.selectedIndex];

        let dtarray = this.table?.DataArray ?? [];
        let curr_row = this.table.CurrentRowIndex();
        
        let ialmacen = Number(opt_cconsumo.getAttribute("data-almacen"));
        let iproducto = (p.iproducto || p.sys_pk);
        let precio = await this.precioProducto(iproducto,1);
        if (precio > 0) p.precio = precio;
        let i = this.calculateTaxes(p);
        let lu = this.joinUnidades(p.unidada,p.unidadb,p.unidadc,p.unidadd,p.unidade);
        
        let producto = 
        {
            // campos visibles en el editable.
            origen: (p.origen || ""),
            codigo: p.codigo,
            descripcion: p.descripcion,
            unidad: p.unidada,
            precio: i.costo,
            cotizado: (p.cotizado || ""),
            cantidad: i.cantidad,
            subtotal: i.subtotal,
            descuentos: i.descuentos,
            impuestos: i.impuestos,
            importe: i.total,
            lote: (p.lote || ""),
            fcad: (p.fcad || ""),
            serie: (p.serie || ""),
            notas: (p.notas || ""),

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
            xfacturar: i.cantidad,
            xsalir: i.cantidad,
            ialmacen: ialmacen,
            iproducto: iproducto,
            documento: (p.documento || null),
            doc_partida: (p.doc_partida || null),

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
            list_unidades: lu,
            reqlote: p.reqlote,
            reqserie: p.reqserie
        }

        let _productos = this.filterData();
        let available_row = (_productos.length > 0) ? _productos.length : 0;
        
        if (dtarray.length === _productos.length) this.table.AddRow();
        if (producto.origen !== "" && producto.notas === "") producto["notas"] = "Origen: "+producto.origen;
        
        dtarray[available_row] = producto
        // this.table.UpdateRow(available_row);
        this.table._printRows();
        this.table.NavTo(available_row,2);
        this.tableSummary();
        this.toggleEdtColumns();
        readonlyControls(["sel_divisa"], true);
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

    delProduct()
    {
        let dtarray = this.table?.DataArray ?? [];
        let curr_row = this.table.CurrentRowIndex();
        let data_row = dtarray[curr_row] ?? {};

        if (curr_row < 0) return;

        if (Object.keys(data_row).length >= this.table.Columns.length)
        {
            this.table.DeleteRow(curr_row);
            this.tableSummary();
            this.toggleEdtColumns();

            if (data_row.origen !== "")
            {
                let dventa = dtarray.filter(obj => obj.origen === data_row.origen)
                if (dventa.length === 0) {
                    let venta = Object.values(this.docs_included).find(obj => obj.referencia === data_row.origen);
                    delete this.docs_included[venta.sys_pk];
                }
            }
        }
        else { this.table.DeleteRow(curr_row); }
    },

    coloringIncludedRows(td,irow,icol,field)
    {
        let obj = this.table.DataArray[irow];
        if (obj.doc_partida && (field!="cantidad" && field!="notas"))
        {
            td.style.backgroundColor = "#FFFFE1"; //"#888";
            td.style.color = "#0000FF"; //"#FFF";
        }
    },

    cellsButtonClickHandler(irow,icol,coldef)
    {
        switch (coldef.field) {
            case "codigo":
            case "descripcion":
                const ik_producto = document.getElementById("ik_producto");
                ik_producto.searchText("",false);
                break;
            case "lote":
                const ik_lot_prod = document.getElementById("ik_lot_prod");
                this.launchIkLoteSerie(ik_lot_prod);
                break;
            case "serie":
                const ik_ser_prod = document.getElementById("ik_ser_prod");
                this.launchIkLoteSerie(ik_ser_prod);
                break;
        
            default:
            console.warn("Controlador de click no implementado");
                break;
        }
    },

    disableIncludedRows(icol,field,data)
    {
        // Deshabilitar edición a las filas incluidas por un documento tercero.
        if (data.doc_partida && (field!="cantidad" && field!="notas")) this.table.Columns[icol].type = "NoEditable";
        else this.table.Columns[icol].type = this.coldef[icol].type;
    },

    disableCells(icol,field,data)
    {
        // Deshabilitar edición a las celdas de lote, caducidad y serie si el producto no lo requiere.
        if (!["lote","fcad","serie"].includes(field)) return;

        if ((field === "lote" || field === "fcad") && !data.reqlote) this.table.Columns[icol].type = "NoEditable";
        else if (field === "serie" && !data.reqserie) this.table.Columns[icol].type = "NoEditable";
        else this.table.Columns[icol].type = this.coldef[icol].type;
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

        if (Object.keys(producto).length < this.table.Columns.length) return;

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

    async calculateAmounts(e)
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

        if (field === "precio")
        {
            let precio = Number(e.text.trim());
            let tcp = Number(producto.tipocambio);
            let tcd = Number(this.ff["tipocambio"].value ?? "1");

            producto["precio"] = precio;
            producto["_precio"] = this.convertirADivisa(precio,tcp,tcd,"prod");
        }
        if (field === "cantidad")
        {
            let cantidad = Number(e.text.trim());

            if (producto.reqserie && cantidad > 1) {
                alert("La cantidad para este producto con serie requerida debe ser 1, para agregar más series del mismo producto insertelo en una nueva fila");
                cantidad = 1;
            }

            if (cantidad > 1 && !producto.doc_partida)
            {
                let precio = await this.precioProducto(producto.iproducto, cantidad);
                if (precio > 0 && precio < producto.precio) {
                    document.getElementById("toast-title").innerText = producto.descripcion;
                    document.getElementById("toast-body").innerText = "Nuevo precio determinado.";
                    showToast("toast");
                    
                    let tcp = Number(producto.tipocambio);
                    let tcd = Number(this.ff["tipocambio"].value ?? "1");
                    
                    producto["precio"] = precio;
                    producto["_precio"] = this.convertirADivisa(precio,tcp,tcd,"prod");
                }
            }
            
            e.text = cantidad;
            producto["cantidad"] = cantidad;
            producto["xfacturar"] = cantidad;
            producto["xsalir"] = cantidad;
        }
        if (field === "descuentos") producto["descuentos"] = Number(e.text.trim());
        
        this.edtProduct(producto,curr_row);
    },
}