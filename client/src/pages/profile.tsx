import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building, UserCircle, Users, Camera, Loader2, Crown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Department } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: profile } = useQuery({ queryKey: ["/api/users/me"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    profileImageUrl: "",
    departmentId: "",
    superiorId: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        profileImageUrl: profile.profileImageUrl || "",
        departmentId: profile.departmentId?.toString() || "",
        superiorId: profile.superiorId || ""
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "修改成功" });
    }
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "上传失败");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, profileImageUrl: data.profileImageUrl || "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "头像上传成功" });
    },
    onError: (err: Error) => {
      toast({ title: "上传失败", description: err.message, variant: "destructive" });
    }
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "图片大小不能超过 2MB", variant: "destructive" });
      return;
    }
    avatarMutation.mutate(file);
    e.target.value = "";
  };

  const currentDeptName = formData.departmentId
    ? departments.find(d => d.id === Number(formData.departmentId))?.name || ""
    : "";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
        <UserCircle className="h-6 w-6 text-blue-500" />
        个人中心
      </h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            头像与基本信息
            {profile?.userType === "department_head" && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 gap-0.5">
                <Crown className="h-2.5 w-2.5" />
                部门长
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick} data-testid="button-avatar-upload">
              <Avatar className="h-20 w-20 border-2 border-blue-500/30 shadow-lg shadow-blue-500/10">
                <AvatarImage src={formData.profileImageUrl} />
                <AvatarFallback className="bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xl">
                  {formData.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {avatarMutation.isPending ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">点击头像上传图片（支持 JPG/PNG，不超过 2MB）</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-avatar-file"
            />
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-xs text-slate-500 dark:text-slate-400">显示名称</label>
              <Input
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="glass-input"
                data-testid="input-display-name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-slate-500 dark:text-slate-400">所属部门</label>
              <Select
                value={formData.departmentId || "none"}
                onValueChange={v => setFormData({...formData, departmentId: v === "none" ? "" : v})}
              >
                <SelectTrigger className="glass-input" data-testid="select-department">
                  <Building className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent className="glass-dialog">
                  <SelectItem value="none">未分配</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-slate-500 dark:text-slate-400">上级主管</label>
              <Select
                value={formData.superiorId || "none"}
                onValueChange={v => setFormData({...formData, superiorId: v === "none" ? "" : v})}
              >
                <SelectTrigger className="glass-input" data-testid="select-superior">
                  <SelectValue placeholder="选择上级" />
                </SelectTrigger>
                <SelectContent className="glass-dialog">
                  <SelectItem value="none">无</SelectItem>
                  {profile?.departmentUsers?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Users className="h-3 w-3" />
              关联下级 (同部门)
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile?.departmentUsers?.filter((u: any) => u.superiorId === profile.id).map((u: any) => (
                <div key={u.id} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                  {u.firstName || u.email}
                </div>
              ))}
              {profile?.departmentUsers?.filter((u: any) => u.superiorId === profile.id).length === 0 && (
                <span className="text-xs text-slate-500 italic">暂无关联下级</span>
              )}
            </div>
          </div>

          <Button
            onClick={() => mutation.mutate({
              firstName: formData.firstName,
              profileImageUrl: formData.profileImageUrl,
              departmentId: formData.departmentId || null,
              superiorId: formData.superiorId || null,
            })}
            className="w-full glow-btn text-white border-0"
            disabled={mutation.isPending}
            data-testid="button-save-profile"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            保存修改
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
