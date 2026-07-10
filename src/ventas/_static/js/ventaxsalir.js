document.addEventListener("DOMContentLoaded",()=>ventaxsalir.init());


var ventaxsalir=
{
    init()
    {
        this.btn_procesar=document.getElementById("btn_procesar");
        this.table=document.getElementById("tbl_productos");

        if(this.btn_procesar)this.btn_procesar.addEventListener("click",()=>this.process());
        if(this.table)
        {
            this.table.AutoAddRow = false;
            this.table.AutoDelRow = false;
        }
    },
    prepateData()
    {
        if(!this.table)
        {
            console.warn("No hay un elemento editable");
            return null;
        }
        
        let data=this.table.DataArray.filter(e=>e.cantidad_a_salir>0);
        if(!data || data.length < 1)
        {
            alert("Debe indicar la cantidad a salir de alguna partida");
            return null
        }
        let find=ventaxsalir.table.DataArray.find(e=> e.xsalir < e.cantidad_a_salir);
        if(find)
        {
            alert("El campo cantidad de entrega no puede ser mayor al campo por salir del producto: "+find.codigo+" - "+find.descripcion);
            return null;
        }
        return data;
    },
    process()
    {
        let data=this.prepateData();
        if(!data)return;
        let fd = new FormData();

        fd.append("_detalle",JSON.stringify(data));

        let endpoint = "./process/";
        let method = "PATCH";

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                this.is_on_submit = false;
                return
            }

            window.location.href = "..";
        }

        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            alert(content);
            this.is_on_submit = false;
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    }
}