import { Component, OnInit } from "@angular/core";
import { NavigationExtras, Router } from "@angular/router";
import { AuthService } from "src/app/services/auth.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {

  username!: string;
  password!: string;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {
    localStorage.setItem("section", "home");
  }

  ngOnInit() {
    document.body.addEventListener("scroll", event => this.onScroll(event));
  }

  onScroll(event: any) {
    var navbar = document.querySelector('#nav-bar')
    if (event.target.scrollTop > 0) {
      navbar?.classList.add('stickyadd')
    } else {
      navbar?.classList.remove('stickyadd')
    }
  }

  changeOption(opt: string) {
    localStorage.setItem("section", opt)
    if (!this.navigateTo(`${opt}-anchor`)) {
      this.router.navigate(['home'], { queryParams: { section: opt } });
    }
  }

  navTo(route: string, opt: string) {
    localStorage.setItem("section", opt)
    this.forcedNavigate([route]);
  }

  navigateTo(nodeName: string) {
    const node = document.getElementById(nodeName);

    if (!node) {
      return false;
    }
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  onSectionChange(section: string) {
    localStorage.setItem("section", section)
  }



  getSection() {
    return localStorage.getItem("section");
  }

  forcedNavigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => this.router.navigate(commands, extras));
  }
  
}
