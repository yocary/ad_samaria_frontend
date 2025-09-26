import Swal, { SweetAlertIcon } from "sweetalert2";

export class AlertUtils {
  static showToast(icon?: SweetAlertIcon, title?: string, text?: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({ icon, title, text });
  }
}
