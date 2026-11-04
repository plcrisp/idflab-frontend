import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared-module';
import { Profile } from './profile';
import { PROFILE_ROUTES } from './profile.routes';

import { NgIconsModule } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBuilding2,
  lucideCalendar,
  lucideCheck,
  lucideFolderOpen,
  lucideKeyRound,
  lucideLock,
  lucideMail,
  lucideRotateCcw,
  lucideSend,
  lucideShieldCheck,
  lucideUser,
} from '@ng-icons/lucide';

import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

@NgModule({
  declarations: [Profile],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(PROFILE_ROUTES),
    SharedModule,
    ...HlmAvatarImports,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmInputGroupImports,
    ...HlmLabelImports,
    ...HlmSkeletonImports,
    ...HlmSpinnerImports,
    ...HlmToggleGroupImports,
    NgIconsModule.withIcons({
      lucideArrowRight,
      lucideBuilding2,
      lucideCalendar,
      lucideCheck,
      lucideFolderOpen,
      lucideKeyRound,
      lucideLock,
      lucideMail,
      lucideRotateCcw,
      lucideSend,
      lucideShieldCheck,
      lucideUser,
    }),
  ],
})
export class ProfileModule {}
